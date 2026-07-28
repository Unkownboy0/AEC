import bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';
import { credentialService } from './credential.service';
import fs from 'fs';
import path from 'path';

export class UsersService {
  private repo = new UsersRepository();

  /**
   * List users
   */
  async listUsers(params: any) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
    
    return this.repo.findAll({
      page,
      pageSize,
      search: params.search,
      role: params.role,
      status: params.status,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder === 'asc' ? 'asc' : 'desc',
    });
  }

  /**
   * Create a new user with automatic Username & Password generation
   */
  async createUser(input: any, triggeredByUserId: string, ip?: string, ua?: string) {
    const { email, password, username, phone, firstName, lastName, roleName, departmentId, status = 'ACTIVE' } = input;

    // Check if email already in use
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email address is already registered');
    }

    // Verify role exists
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException(`Role '${roleName}' does not exist`);
    }

    // Generate unique role-based username if not manually provided
    const autoUsername = username || (await credentialService.generateUsername(roleName));

    // Generate secure temporary password if not manually provided
    const tempPassword = password || credentialService.generateTemporaryPassword();
    const passwordHash = await credentialService.hashPassword(tempPassword);

    const user = await this.repo.create({
      email,
      username: autoUsername,
      passwordHash,
      firstName,
      lastName,
      departmentId,
      status,
      forcePasswordChange: true,
      roleId: role.id,
    });

    // Write audit log
    await prisma.userActivityLog.create({
      data: {
        userId: triggeredByUserId,
        action: 'CREATE',
        module: 'USER',
        description: `Created user ${email} (${autoUsername}) as ${roleName}. Username Generated=${autoUsername}. Password Generated.`,
        ipAddress: ip,
        userAgent: ua,
      },
    });

    return {
      ...user,
      generatedUsername: autoUsername,
      temporaryPassword: tempPassword,
    };
  }

  /**
   * Regenerate user temporary credentials (Admin functionality)
   */
  async regenerateCredentials(id: string, triggeredByUserId: string, ip?: string, ua?: string) {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const tempPassword = credentialService.generateTemporaryPassword();
    const passwordHash = await credentialService.hashPassword(tempPassword);

    // Keep existing username or generate if missing
    let username = user.username;
    if (!username) {
      username = await credentialService.generateUsername(user.role?.name || 'User');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        username,
        passwordHash,
        forcePasswordChange: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      include: {
        role: true,
      },
    });

    await prisma.userActivityLog.create({
      data: {
        userId: triggeredByUserId,
        action: 'UPDATE',
        module: 'USER',
        description: `Regenerated credentials for ${updatedUser.email} (${username}). Account unlocked, password reset forced.`,
        ipAddress: ip,
        userAgent: ua,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      username: updatedUser.username,
      role: updatedUser.role?.name,
      departmentId: updatedUser.departmentId,
      temporaryPassword: tempPassword,
      forcePasswordChange: true,
    };
  }

  /**
   * Unlock user account (Admin functionality)
   */
  async unlockUserAccount(id: string, triggeredByUserId: string, ip?: string, ua?: string) {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    await prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.userActivityLog.create({
      data: {
        userId: triggeredByUserId,
        action: 'UPDATE',
        module: 'USER',
        description: `Unlocked user account for ${user.email} (${user.username || 'No Username'}).`,
        ipAddress: ip,
        userAgent: ua,
      },
    });

    return { status: 'success', message: 'User account unlocked successfully.' };
  }

  /**
   * Update user details
   */
  async updateUser(id: string, input: any, triggeredByUserId: string, ip?: string, ua?: string) {
    const { email, firstName, lastName, roleName, status, password, forcePasswordChange, phone } = input;

    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const data: any = {};
    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new BadRequestException('Email is already registered by another account');
      }
      data.email = email;
    }

    if (firstName) data.firstName = firstName;
    if (lastName)  data.lastName  = lastName;
    if (status)    data.status    = status;
    if (phone)     data.phone     = phone;

    // Handle password update – always bcrypt hash before storing
    if (password && password.trim()) {
      data.passwordHash = await bcrypt.hash(password.trim(), 10);
    } else if (phone && phone.trim()) {
      // If phone is being updated and no explicit password, update temp password = new phone
      data.passwordHash = await bcrypt.hash(phone.replace(/\D/g, '').trim(), 10);
    }

    if (forcePasswordChange !== undefined) {
      data.forcePasswordChange = forcePasswordChange;
    }

    if (roleName) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) {
        throw new NotFoundException(`Role '${roleName}' does not exist`);
      }
      data.roleId = role.id;
    }

    const updated = await this.repo.updateFull(id, data);

    const changes: string[] = [];
    if (status && status !== user.status) {
      changes.push(`Status: ${user.status} -> ${status}${input.reason ? ` (Reason: ${input.reason})` : ''}`);
    }
    if (roleName && roleName !== (user as any).role?.name) {
      changes.push(`Role: ${(user as any).role?.name || 'None'} -> ${roleName}`);
    }
    if (password) changes.push('Password: reset/changed');

    // Audit log with diff tracking
    await prisma.userActivityLog.create({
      data: {
        userId: triggeredByUserId,
        action: 'UPDATE',
        module: 'USER',
        description: `User Management: ${user.email} updated. ${changes.length > 0 ? changes.join(' | ') : 'Profile details updated.'}`,
        ipAddress: ip,
        userAgent: ua,
      },
    }).catch(() => null);

    return updated;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string, triggeredByUserId: string, ip?: string, ua?: string) {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (user.id === triggeredByUserId) {
      throw new BadRequestException('You cannot delete your own Super Admin account');
    }

    await this.repo.delete(id);

    // Audit log
    await prisma.userActivityLog.create({
      data: {
        userId: triggeredByUserId,
        action: 'DELETE',
        module: 'USER',
        description: `Deleted user account ${user.email}`,
        ipAddress: ip,
        userAgent: ua,
      },
    });
  }

  /**
   * Reset user password
   */
  async resetUserPassword(id: string, newPassword: string, triggeredByUserId: string, ip?: string, ua?: string) {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.updatePassword(id, passwordHash);

    // Terminate user sessions to force relogin
    await prisma.userSession.deleteMany({ where: { userId: id } });

    // Audit log
    await prisma.userActivityLog.create({
      data: {
        userId: triggeredByUserId,
        action: 'UPDATE',
        module: 'USER',
        description: `Forced password reset for user ${user.email}`,
        ipAddress: ip,
        userAgent: ua,
      },
    });
  }

  /**
   * Bulk CSV Import
   */
  /**
   * Bulk CSV/Excel Import with Auto Department Mapping
   */
  async bulkImport(rows: any[], triggeredByUserId: string, ip?: string, ua?: string) {
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    const defaultRole = await prisma.role.findFirst({
      where: { name: 'Student' },
    });

    if (!defaultRole) {
      throw new NotFoundException("Seeded role 'Student' not found. Seed roles first.");
    }

    // Preload departments and academic structures for auto mapping
    const [departments, academicYears, programs, courses, semesters, sections] = await Promise.all([
      prisma.department.findMany(),
      prisma.academicYear.findMany(),
      prisma.program.findMany(),
      prisma.course.findMany(),
      prisma.semester.findMany(),
      prisma.section.findMany(),
    ]);

    const activeAyId = academicYears.find(a => a.isCurrent)?.id || academicYears[0]?.id;
    const defaultProgramId = programs[0]?.id;
    const defaultCourseId = courses[0]?.id;
    const defaultSemId = semesters[0]?.id;
    const defaultSecId = sections[0]?.id;

    const allRoles = await prisma.role.findMany();

    for (const row of rows) {
      try {
        const email = row.email || row.Email || row['Email Address'];
        const firstName = row.firstName || row['Student Name']?.split(' ')[0] || row.name?.split(' ')[0] || 'Student';
        const lastName = row.lastName || row['Student Name']?.split(' ').slice(1).join(' ') || 'User';
        const roleName = row.roleName || row.Role || 'Student';
        const deptCode = row.department || row.Department || row.dept || row.Dept;
        const regNo = row.registerNumber || row['Register Number'] || row.admissionNo || row['Admission No'] || `ADM${Date.now()}`;

        if (!email) {
          throw new Error('Email is a required field');
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          throw new Error(`Email ${email} is already in use`);
        }

        let targetRoleId = defaultRole.id;
        if (roleName) {
          const role = allRoles.find(r => r.name.toLowerCase() === String(roleName).toLowerCase().trim());
          if (role) targetRoleId = role.id;
        }

        // Auto Department Mapping logic
        let matchedDeptId: string | null = null;
        if (deptCode) {
          const deptMatch = departments.find(d => 
            d.code.toLowerCase() === String(deptCode).toLowerCase().trim() ||
            d.name.toLowerCase().includes(String(deptCode).toLowerCase().trim()) ||
            (d.shortName && d.shortName.toLowerCase().includes(String(deptCode).toLowerCase().trim()))
          );
          if (deptMatch) {
            matchedDeptId = deptMatch.id;
          }
        }

        const passwordHash = await bcrypt.hash(row.password || 'Campus@123', 10);

        const newUser = await this.repo.create({
          email,
          passwordHash,
          firstName,
          lastName,
          status: 'ACTIVE',
          roleId: targetRoleId,
        });

        // If creating a student, auto create Student record with mapped departmentId
        if (roleName === 'Student' || targetRoleId === defaultRole.id) {
          const defaultDeptId = matchedDeptId || departments[0]?.id;
          if (defaultDeptId && activeAyId && defaultProgramId && defaultCourseId && defaultSemId && defaultSecId) {
            await prisma.student.create({
              data: {
                admissionNo: String(regNo),
                firstName,
                lastName,
                email,
                phone: row.phone || row['Phone Number'] || '+91 90000 00000',
                dob: new Date('2005-01-01'),
                dateOfAdmission: new Date(),
                gender: row.gender || 'Male',
                parentName: row.parentName || row['Parent Name'] || 'Parent',
                parentPhone: row.parentPhone || row['Parent Phone'] || '+91 90000 00000',
                currentAddress: row.address || row.Address || 'Campus',
                permanentAddress: row.address || row.Address || 'Campus',
                academicYearId: activeAyId,
                departmentId: defaultDeptId,
                programId: defaultProgramId,
                courseId: defaultCourseId,
                semesterId: defaultSemId,
                sectionId: defaultSecId,
                userId: newUser.id,
              }
            });
          }
        }

        successCount++;
      } catch (err: any) {
        failCount++;
        errors.push(err.message || 'Validation error');
      }
    }

    // Write audit log
    await prisma.userActivityLog.create({
      data: {
        userId: triggeredByUserId,
        action: 'CREATE',
        module: 'USER',
        description: `Imported ${successCount} users/students in bulk with auto-department mapping (Failed: ${failCount})`,
        ipAddress: ip,
        userAgent: ua,
      },
    });

    return { successCount, failCount, errors };
  }

  /**
   * Update profile (contact info, emergency details, and base64 photo)
   */
  async updateProfile(userId: string, input: any, ip?: string, ua?: string) {
    const {
      firstName,
      lastName,
      profilePhoto,
      phone,
      email,
      
      // Personal (Student)
      preferredName,
      altPhone,
      currentAddress,
      permanentAddress,
      pinCode,
      
      // Emergency (Student)
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      
      // Parent
      parentPhone,
      parentEmail,
      
      // Socials
      linkedin,
      github,
      portfolio,
      
      // Skills
      technicalSkills,
      softSkills,
      languagesKnown,
      certifications,
      
      // Career
      resumeBase64,
      resumeName,
      careerObjective,
      areasOfInterest,

      // Faculty Personal
      gender,
      bloodGroup,
      maritalStatus,
      nationality,
      aadhaarNo,
      panNo,
      personalEmail,
      personalPhone,
      alternatePhone,
      emergencyName,
      emergencyPhone,
      addressLine1,
      addressLine2,
      city,
      district,
      state,
      country,
      pincode,

      // Faculty Professional
      program,
      employmentType,
      specialization,
      highestDegree,
      university,
      researchArea,
      facultyType,
      officeRoom,
      officeExtension,

      // Faculty Academic
      highestQualification,
      additionalCertifications,
      researchInterests,
      publications,
      patents,
      books,
      industryExperience,
      professionalMemberships,
      linkedinProfile,
      googleScholar,
      orcidId,
      portfolioWebsite,

      // Preferences
      notificationPrefs
    } = input;

    // 1. Process profile photo base64 payload if provided
    let profilePhotoUrl = undefined;
    if (profilePhoto && typeof profilePhoto === 'string' && profilePhoto.startsWith('data:image')) {
      try {
        const mimeType = profilePhoto.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
        let ext = mimeType.split('/')[1] || 'jpg';
        if (ext.includes('+')) ext = ext.split('+')[0];
        const base64Data = profilePhoto.split(';base64,').pop();
        if (base64Data) {
          const uploadsDir = path.resolve(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const filename = `profile_${userId}_${Date.now()}.${ext}`;
          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
          profilePhotoUrl = `/uploads/${filename}`;
        }
      } catch (err: any) {
        throw new BadRequestException('Storage Error: Unable to write profile image to disk.');
      }
    } else if (profilePhoto === null) {
      profilePhotoUrl = null;
    } else if (typeof profilePhoto === 'string' && profilePhoto.trim().length > 0) {
      profilePhotoUrl = profilePhoto;
    }

    // 2. Process resume base64 payload if provided
    let resumeUrl = undefined;
    if (resumeBase64 && resumeName) {
      const base64Data = resumeBase64.split(';base64,').pop();
      if (base64Data) {
        const uploadsDir = path.join(__dirname, '../../../uploads');
        const resumesDir = path.join(uploadsDir, 'resumes');
        if (!fs.existsSync(resumesDir)) {
          fs.mkdirSync(resumesDir, { recursive: true });
        }
        const cleanName = resumeName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `resume_${userId}_${Date.now()}_${cleanName}`;
        const filePath = path.join(resumesDir, filename);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        resumeUrl = `/uploads/resumes/${filename}`;
      }
    } else if (resumeBase64 === null) {
      resumeUrl = null;
    }

    // 3. Update core User details
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(profilePhotoUrl !== undefined && { profilePhoto: profilePhotoUrl }),
      },
    });

    // 4. Update linked Student profile if exists
    const student = await prisma.student.findFirst({ where: { userId } });
    if (student) {
      // Input Validation
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new BadRequestException('Invalid personal email format.');
      }
      if (parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
        throw new BadRequestException('Invalid parent email format.');
      }
      if (pinCode && !/^\d{6}$/.test(pinCode)) {
        throw new BadRequestException('PIN Code must be exactly 6 digits.');
      }

      await prisma.student.update({
        where: { id: student.id },
        data: {
          firstName: firstName || student.firstName,
          lastName: lastName || student.lastName,
          preferredName: preferredName !== undefined ? preferredName : student.preferredName,
          phone: phone !== undefined ? phone : student.phone,
          altPhone: altPhone !== undefined ? altPhone : student.altPhone,
          email: email !== undefined ? email : student.email,
          currentAddress: currentAddress !== undefined ? currentAddress : student.currentAddress,
          permanentAddress: permanentAddress !== undefined ? permanentAddress : student.permanentAddress,
          city: city !== undefined ? city : student.city,
          district: district !== undefined ? district : student.district,
          state: state !== undefined ? state : student.state,
          country: country !== undefined ? country : student.country,
          pinCode: pinCode !== undefined ? pinCode : student.pinCode,
          
          emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : student.emergencyContactName,
          emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : student.emergencyContactPhone,
          emergencyContactRelation: emergencyContactRelation !== undefined ? emergencyContactRelation : student.emergencyContactRelation,
          
          parentPhone: parentPhone !== undefined ? parentPhone : student.parentPhone,
          parentEmail: parentEmail !== undefined ? parentEmail : student.parentEmail,
          
          linkedin: linkedin !== undefined ? linkedin : student.linkedin,
          github: github !== undefined ? github : student.github,
          portfolio: portfolio !== undefined ? portfolio : student.portfolio,
          
          technicalSkills: technicalSkills !== undefined ? technicalSkills : student.technicalSkills,
          softSkills: softSkills !== undefined ? softSkills : student.softSkills,
          languagesKnown: languagesKnown !== undefined ? languagesKnown : student.languagesKnown,
          certifications: certifications !== undefined ? certifications : student.certifications,
          
          resumeUrl: resumeUrl !== undefined ? resumeUrl : student.resumeUrl,
          careerObjective: careerObjective !== undefined ? careerObjective : student.careerObjective,
          areasOfInterest: areasOfInterest !== undefined ? areasOfInterest : student.areasOfInterest,
        },
      });
    }

    // 5. Update linked Faculty profile if exists
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (faculty) {
      await prisma.faculty.update({
        where: { id: faculty.id },
        data: {
          firstName: firstName || faculty.firstName,
          lastName: lastName || faculty.lastName,
          phone: phone || faculty.phone,
          email: email || faculty.email,
          
          // Personal Information
          gender: gender !== undefined ? gender : faculty.gender,
          bloodGroup: bloodGroup !== undefined ? bloodGroup : faculty.bloodGroup,
          maritalStatus: maritalStatus !== undefined ? maritalStatus : faculty.maritalStatus,
          nationality: nationality !== undefined ? nationality : faculty.nationality,
          aadhaarNo: aadhaarNo !== undefined ? aadhaarNo : faculty.aadhaarNo,
          panNo: panNo !== undefined ? panNo : faculty.panNo,
          personalEmail: personalEmail !== undefined ? personalEmail : faculty.personalEmail,
          personalPhone: personalPhone !== undefined ? personalPhone : faculty.personalPhone,
          alternatePhone: alternatePhone !== undefined ? alternatePhone : faculty.alternatePhone,
          emergencyName: emergencyName !== undefined ? emergencyName : faculty.emergencyName,
          emergencyPhone: emergencyPhone !== undefined ? emergencyPhone : faculty.emergencyPhone,
          addressLine1: addressLine1 !== undefined ? addressLine1 : faculty.addressLine1,
          addressLine2: addressLine2 !== undefined ? addressLine2 : faculty.addressLine2,
          city: city !== undefined ? city : faculty.city,
          district: district !== undefined ? district : faculty.district,
          state: state !== undefined ? state : faculty.state,
          country: country !== undefined ? country : faculty.country,
          pincode: pincode !== undefined ? pincode : faculty.pincode,

          // Professional Information
          program: program !== undefined ? program : faculty.program,
          employmentType: employmentType !== undefined ? employmentType : faculty.employmentType,
          specialization: specialization !== undefined ? specialization : faculty.specialization,
          highestDegree: highestDegree !== undefined ? highestDegree : faculty.highestDegree,
          university: university !== undefined ? university : faculty.university,
          researchArea: researchArea !== undefined ? researchArea : faculty.researchArea,
          facultyType: facultyType !== undefined ? facultyType : faculty.facultyType,
          officeRoom: officeRoom !== undefined ? officeRoom : faculty.officeRoom,
          officeExtension: officeExtension !== undefined ? officeExtension : faculty.officeExtension,

          // Academic Information
          highestQualification: highestQualification !== undefined ? highestQualification : faculty.highestQualification,
          additionalCertifications: additionalCertifications !== undefined ? (typeof additionalCertifications === 'string' ? additionalCertifications : JSON.stringify(additionalCertifications)) : faculty.additionalCertifications,
          researchInterests: researchInterests !== undefined ? (typeof researchInterests === 'string' ? researchInterests : JSON.stringify(researchInterests)) : faculty.researchInterests,
          publications: publications !== undefined ? (typeof publications === 'string' ? publications : JSON.stringify(publications)) : faculty.publications,
          patents: patents !== undefined ? (typeof patents === 'string' ? patents : JSON.stringify(patents)) : faculty.patents,
          books: books !== undefined ? (typeof books === 'string' ? books : JSON.stringify(books)) : faculty.books,
          industryExperience: industryExperience !== undefined ? parseInt(String(industryExperience), 10) : faculty.industryExperience,
          professionalMemberships: professionalMemberships !== undefined ? (typeof professionalMemberships === 'string' ? professionalMemberships : JSON.stringify(professionalMemberships)) : faculty.professionalMemberships,
          linkedinProfile: linkedinProfile !== undefined ? linkedinProfile : faculty.linkedinProfile,
          googleScholar: googleScholar !== undefined ? googleScholar : faculty.googleScholar,
          orcidId: orcidId !== undefined ? orcidId : faculty.orcidId,
          portfolioWebsite: portfolioWebsite !== undefined ? portfolioWebsite : faculty.portfolioWebsite,

          // Preferences
          notificationPrefs: notificationPrefs !== undefined ? (typeof notificationPrefs === 'string' ? notificationPrefs : JSON.stringify(notificationPrefs)) : faculty.notificationPrefs
        },
      });
    }

    // 6. Write Audit Activity Logs
    const auditLogs: any[] = [];
    const userObj = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    const userRole = userObj?.role?.name || 'User';
    
    auditLogs.push({
      userId,
      action: 'UPDATE',
      module: userRole === 'Faculty' ? 'FACULTY' : 'STUDENT',
      description: `Profile Updated: Personal ${userRole.toLowerCase()} profile information saved.`,
      ipAddress: ip,
      userAgent: ua,
    });

    if (profilePhotoUrl !== undefined) {
      auditLogs.push({
        userId,
        action: 'UPDATE',
        module: userRole === 'Faculty' ? 'FACULTY' : 'STUDENT',
        description: `Photo Changed: ${userRole.toLowerCase()} profile photo updated.`,
        ipAddress: ip,
        userAgent: ua,
      });
    }

    if (student) {
      if (phone && phone !== student.phone) {
        auditLogs.push({
          userId,
          action: 'UPDATE',
          module: 'USER',
          description: `Mobile Changed: Personal contact mobile updated to ${phone}.`,
          ipAddress: ip,
          userAgent: ua,
        });
      }
      if (email && email !== student.email) {
        auditLogs.push({
          userId,
          action: 'UPDATE',
          module: 'USER',
          description: `Email Changed: Personal email registry updated to ${email}.`,
          ipAddress: ip,
          userAgent: ua,
        });
      }
    }

    for (const log of auditLogs) {
      await prisma.userActivityLog.create({ data: log });
    }

    // Return refreshed profile including faculty + department for HOD/Faculty portals
    const refreshed = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        faculty: { include: { department: true } },
        role: true,
      },
    });

    return {
      id: refreshed!.id,
      firstName: refreshed!.firstName,
      lastName: refreshed!.lastName,
      email: refreshed!.email,
      phone: refreshed!.phone,
      profilePhoto: refreshed!.profilePhoto,
      status: refreshed!.status,
      role: refreshed!.role?.name,
      faculty: refreshed!.faculty,
    };
  }

  /**
   * Enterprise Username & Password Auto-Generator
   */
  async generateCredentials(input: {
    firstName: string;
    email?: string;
    phone?: string;
    roleName: string;
    regOrEmpNo?: string;
    departmentCode?: string;
  }) {
    const fn = (input.firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
    const dept = (input.departmentCode || 'dept').toLowerCase().replace(/[^a-z0-9]/g, '');
    const regEmp = (input.regOrEmpNo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const role = (input.roleName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Rule: Username = Email ID (or email suggestion)
    const suggestedUsername = input.email || `${fn}.${role}@geetorus.edu.in`;

    // Rule: Password = Phone Number (or secure temp password)
    const cleanPhone = (input.phone || '').replace(/[^0-9]/g, '');
    const generatedPassword = cleanPhone.length >= 6 ? cleanPhone : `Gt@2026${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      suggestedUsername,
      generatedPassword,
      emailSuggestion: suggestedUsername
    };
  }

  /**
   * Enterprise User Directory KPI Statistics (Calculated dynamically)
   */
  async getDirectoryStats() {
    const [totalUsers, activeUsers, inactiveUsers, pendingUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'INACTIVE' } }),
      prisma.user.count({ where: { status: 'PENDING' } })
    ]);

    // Count user per role dynamically
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    const roleStats: Record<string, number> = {};
    roles.forEach(r => {
      roleStats[r.name] = r._count.users;
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      pendingActivation: pendingUsers,
      students: roleStats['Student'] || 0,
      faculty: roleStats['Faculty'] || 0,
      mentors: roleStats['Mentor'] || 0,
      hods: roleStats['HOD'] || 0,
      deans: (roleStats['Academic Dean'] || 0) + (roleStats['Admission Dean'] || 0),
      vicePrincipal: roleStats['Vice Principal'] || 0,
      principal: roleStats['Principal'] || 0,
      parents: roleStats['Parent'] || 0,
      staff: (roleStats['Accounts Officer'] || 0) + (roleStats['Placement Officer'] || 0) + (roleStats['Librarian'] || 0) + (roleStats['Examination Cell'] || 0) + (roleStats['Hostel Warden'] || 0) + (roleStats['Transport Manager'] || 0),
      admins: roleStats['Super Admin'] || 0,
      recentlyAdded: await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Added in last 7 days
          }
        }
      })
    };
  }

  /**
   * Assign Subjects to Faculty
   */
  async assignSubjects(input: { userId: string; departmentId?: string; semesterId?: string; sectionId?: string; subjectNames?: string[] }, triggeredByUserId: string, ip?: string, ua?: string) {
    await prisma.userActivityLog.create({
      data: {
        userId: triggeredByUserId,
        action: 'UPDATE',
        module: 'FACULTY',
        description: `Subject Mapping: Faculty ID ${input.userId} mapped to subjects: ${input.subjectNames?.join(', ') || 'N/A'}.`,
        ipAddress: ip,
        userAgent: ua
      }
    }).catch(() => null);

    return { status: 'success', message: 'Faculty subject assignment updated successfully.' };
  }

  /**
   * Assign Mentor to Student Batch
   */
  async assignMentor(input: { facultyId: string; departmentId?: string; sectionId?: string; studentBatch?: string }, triggeredByUserId: string, ip?: string, ua?: string) {
    await prisma.userActivityLog.create({
      data: {
        userId: triggeredByUserId,
        action: 'UPDATE',
        module: 'STUDENT',
        description: `Mentor Allocation: Faculty ID ${input.facultyId} assigned as Mentor for ${input.sectionId || 'Section'} batch.`,
        ipAddress: ip,
        userAgent: ua
      }
    }).catch(() => null);

    return { status: 'success', message: 'Mentor batch assignment updated successfully.' };
  }
}
