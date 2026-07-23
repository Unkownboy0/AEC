"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const users_repository_1 = require("./users.repository");
const prisma_1 = require("../../lib/prisma");
const exceptions_1 = require("../../utils/exceptions");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class UsersService {
    repo = new users_repository_1.UsersRepository();
    /**
     * List users
     */
    async listUsers(params) {
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
     * Create a new user
     */
    async createUser(input, triggeredByUserId, ip, ua) {
        const { email, password, firstName, lastName, roleName, status = 'ACTIVE' } = input;
        // Check if email already in use
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new exceptions_1.BadRequestException('Email address is already registered');
        }
        // Verify role exists
        const role = await prisma_1.prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
            throw new exceptions_1.NotFoundException(`Role '${roleName}' does not exist`);
        }
        const passwordHash = await bcryptjs_1.default.hash(password || 'Campus@123', 10);
        const user = await this.repo.create({
            email,
            passwordHash,
            firstName,
            lastName,
            status,
            roleId: role.id,
        });
        // Write audit log
        await prisma_1.prisma.userActivityLog.create({
            data: {
                userId: triggeredByUserId,
                action: 'CREATE',
                module: 'USER',
                description: `Created new user ${email} as ${roleName}`,
                ipAddress: ip,
                userAgent: ua,
            },
        });
        return user;
    }
    /**
     * Update user details
     */
    async updateUser(id, input, triggeredByUserId, ip, ua) {
        const { email, firstName, lastName, roleName, status } = input;
        const user = await this.repo.findById(id);
        if (!user) {
            throw new exceptions_1.NotFoundException('User profile not found');
        }
        const data = {};
        if (email && email !== user.email) {
            const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
            if (existing) {
                throw new exceptions_1.BadRequestException('Email is already registered by another account');
            }
            data.email = email;
        }
        if (firstName)
            data.firstName = firstName;
        if (lastName)
            data.lastName = lastName;
        if (status)
            data.status = status;
        if (roleName) {
            const role = await prisma_1.prisma.role.findUnique({ where: { name: roleName } });
            if (!role) {
                throw new exceptions_1.NotFoundException(`Role '${roleName}' does not exist`);
            }
            data.roleId = role.id;
        }
        const updated = await this.repo.update(id, data);
        // Audit log
        await prisma_1.prisma.userActivityLog.create({
            data: {
                userId: triggeredByUserId,
                action: 'UPDATE',
                module: 'USER',
                description: `Modified user account ${user.email} settings`,
                ipAddress: ip,
                userAgent: ua,
            },
        });
        return updated;
    }
    /**
     * Delete user
     */
    async deleteUser(id, triggeredByUserId, ip, ua) {
        const user = await this.repo.findById(id);
        if (!user) {
            throw new exceptions_1.NotFoundException('User profile not found');
        }
        if (user.id === triggeredByUserId) {
            throw new exceptions_1.BadRequestException('You cannot delete your own Super Admin account');
        }
        await this.repo.delete(id);
        // Audit log
        await prisma_1.prisma.userActivityLog.create({
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
    async resetUserPassword(id, newPassword, triggeredByUserId, ip, ua) {
        const user = await this.repo.findById(id);
        if (!user) {
            throw new exceptions_1.NotFoundException('User profile not found');
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await this.repo.updatePassword(id, passwordHash);
        // Terminate user sessions to force relogin
        await prisma_1.prisma.userSession.deleteMany({ where: { userId: id } });
        // Audit log
        await prisma_1.prisma.userActivityLog.create({
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
    async bulkImport(rows, triggeredByUserId, ip, ua) {
        let successCount = 0;
        let failCount = 0;
        const errors = [];
        // Preload default student role
        const defaultRole = await prisma_1.prisma.role.findFirst({
            where: { name: 'Student' },
        });
        if (!defaultRole) {
            throw new exceptions_1.NotFoundException("Seeded role 'Student' not found. Seed roles first.");
        }
        for (const row of rows) {
            try {
                const { email, password, firstName, lastName, roleName } = row;
                if (!email || !firstName || !lastName) {
                    throw new Error('Email, FirstName and LastName are required fields');
                }
                const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
                if (existing) {
                    throw new Error(`Email ${email} is already in use`);
                }
                let targetRoleId = defaultRole.id;
                if (roleName) {
                    const role = await prisma_1.prisma.role.findUnique({ where: { name: roleName } });
                    if (role)
                        targetRoleId = role.id;
                }
                const passwordHash = await bcryptjs_1.default.hash(password || 'Campus@123', 10);
                await this.repo.create({
                    email,
                    passwordHash,
                    firstName,
                    lastName,
                    status: 'ACTIVE',
                    roleId: targetRoleId,
                });
                successCount++;
            }
            catch (err) {
                failCount++;
                errors.push(err.message || 'Validation error');
            }
        }
        // Write audit log
        await prisma_1.prisma.userActivityLog.create({
            data: {
                userId: triggeredByUserId,
                action: 'CREATE',
                module: 'USER',
                description: `Imported ${successCount} users in bulk (Failed: ${failCount})`,
                ipAddress: ip,
                userAgent: ua,
            },
        });
        return { successCount, failCount, errors };
    }
    /**
     * Update profile (contact info, emergency details, and base64 photo)
     */
    async updateProfile(userId, input, ip, ua) {
        const { firstName, lastName, profilePhoto, phone, email, 
        // Personal (Student)
        preferredName, altPhone, currentAddress, permanentAddress, pinCode, 
        // Emergency (Student)
        emergencyContactName, emergencyContactPhone, emergencyContactRelation, 
        // Parent
        parentPhone, parentEmail, 
        // Socials
        linkedin, github, portfolio, 
        // Skills
        technicalSkills, softSkills, languagesKnown, certifications, 
        // Career
        resumeBase64, resumeName, careerObjective, areasOfInterest, 
        // Faculty Personal
        gender, bloodGroup, maritalStatus, nationality, aadhaarNo, panNo, personalEmail, personalPhone, alternatePhone, emergencyName, emergencyPhone, addressLine1, addressLine2, city, district, state, country, pincode, 
        // Faculty Professional
        program, employmentType, specialization, highestDegree, university, researchArea, facultyType, officeRoom, officeExtension, 
        // Faculty Academic
        highestQualification, additionalCertifications, researchInterests, publications, patents, books, industryExperience, professionalMemberships, linkedinProfile, googleScholar, orcidId, portfolioWebsite, 
        // Preferences
        notificationPrefs } = input;
        // 1. Process profile photo base64 payload if provided
        let profilePhotoUrl = undefined;
        if (profilePhoto && profilePhoto.startsWith('data:image')) {
            const mimeType = profilePhoto.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
            const ext = mimeType.split('/')[1] || 'jpg';
            const base64Data = profilePhoto.split(';base64,').pop();
            if (base64Data) {
                const uploadsDir = path_1.default.join(__dirname, '../../../uploads');
                if (!fs_1.default.existsSync(uploadsDir)) {
                    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
                }
                const filename = `profile_${userId}_${Date.now()}.${ext}`;
                const filePath = path_1.default.join(uploadsDir, filename);
                fs_1.default.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
                profilePhotoUrl = `/uploads/${filename}`;
            }
        }
        else if (profilePhoto === null) {
            profilePhotoUrl = null;
        }
        // 2. Process resume base64 payload if provided
        let resumeUrl = undefined;
        if (resumeBase64 && resumeName) {
            const base64Data = resumeBase64.split(';base64,').pop();
            if (base64Data) {
                const uploadsDir = path_1.default.join(__dirname, '../../../uploads');
                const resumesDir = path_1.default.join(uploadsDir, 'resumes');
                if (!fs_1.default.existsSync(resumesDir)) {
                    fs_1.default.mkdirSync(resumesDir, { recursive: true });
                }
                const cleanName = resumeName.replace(/[^a-zA-Z0-9.-]/g, '_');
                const filename = `resume_${userId}_${Date.now()}_${cleanName}`;
                const filePath = path_1.default.join(resumesDir, filename);
                fs_1.default.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
                resumeUrl = `/uploads/resumes/${filename}`;
            }
        }
        else if (resumeBase64 === null) {
            resumeUrl = null;
        }
        // 3. Update core User details
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(profilePhotoUrl !== undefined && { profilePhoto: profilePhotoUrl }),
            },
        });
        // 4. Update linked Student profile if exists
        const student = await prisma_1.prisma.student.findFirst({ where: { userId } });
        if (student) {
            // Input Validation
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                throw new exceptions_1.BadRequestException('Invalid personal email format.');
            }
            if (parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
                throw new exceptions_1.BadRequestException('Invalid parent email format.');
            }
            if (pinCode && !/^\d{6}$/.test(pinCode)) {
                throw new exceptions_1.BadRequestException('PIN Code must be exactly 6 digits.');
            }
            await prisma_1.prisma.student.update({
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
        const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId } });
        if (faculty) {
            await prisma_1.prisma.faculty.update({
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
        const auditLogs = [];
        const userObj = await prisma_1.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
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
            await prisma_1.prisma.userActivityLog.create({ data: log });
        }
        return updatedUser;
    }
}
exports.UsersService = UsersService;
//# sourceMappingURL=users.service.js.map