import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';

export class CurriculumService {
  // ==========================================
  // 1. REGULATIONS & ACADEMIC YEARS
  // ==========================================
  async getRegulations() {
    return prisma.regulation.findMany({
      where: { deleted: false },
      orderBy: { code: 'desc' },
      include: {
        _count: {
          select: { subjects: true }
        }
      }
    });
  }

  async createRegulation(data: { code: string; title: string; effectiveYear: string; description?: string }) {
    const existing = await prisma.regulation.findUnique({ where: { code: data.code } });
    if (existing) throw new BadRequestException(`Regulation with code ${data.code} already exists`);
    
    return prisma.regulation.create({
      data: {
        code: data.code,
        title: data.title,
        effectiveYear: data.effectiveYear,
        description: data.description,
        status: 'DRAFT',
        version: 1
      }
    });
  }

  async updateRegulation(id: string, data: any) {
    const reg = await prisma.regulation.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Regulation not found');
    return prisma.regulation.update({
      where: { id },
      data
    });
  }

  async duplicateRegulation(id: string, newCode: string, newTitle: string, newEffectiveYear: string) {
    const sourceReg = await prisma.regulation.findUnique({
      where: { id },
      include: {
        subjects: {
          include: {
            courseOutcomes: { include: { mappings: true } },
            curriculumUnits: { include: { topics: true } },
            materials: true,
            labExperiments: true
          }
        }
      }
    });

    if (!sourceReg) throw new NotFoundException('Source regulation not found');

    const duplicateReg = await prisma.regulation.create({
      data: {
        code: newCode,
        title: newTitle,
        effectiveYear: newEffectiveYear,
        description: `Duplicated from ${sourceReg.code}`,
        status: 'DRAFT',
        version: 1
      }
    });

    // Duplicate all subjects, units, topics, COs
    for (const sub of sourceReg.subjects) {
      const createdSub = await prisma.subject.create({
        data: {
          name: sub.name,
          code: `${sub.code}_${newCode}`,
          credits: sub.credits,
          theoryHours: sub.theoryHours,
          practicalHours: sub.practicalHours,
          tutorialHours: sub.tutorialHours,
          internalMarks: sub.internalMarks,
          externalMarks: sub.externalMarks,
          passingMarks: sub.passingMarks,
          isElective: sub.isElective,
          isLab: sub.isLab,
          isCore: sub.isCore,
          isSkillBased: sub.isSkillBased,
          isOpenElective: sub.isOpenElective,
          isProfessionalElective: sub.isProfessionalElective,
          regulationId: duplicateReg.id,
          semesterId: sub.semesterId,
          departmentId: sub.departmentId,
          programId: sub.programId,
          description: sub.description,
          approvalStatus: 'DRAFT'
        }
      });

      // Duplicate COs
      for (const co of sub.courseOutcomes) {
        const createdCo = await prisma.courseOutcome.create({
          data: {
            subjectId: createdSub.id,
            code: co.code,
            description: co.description,
            bloomLevel: co.bloomLevel
          }
        });

        for (const map of co.mappings) {
          await prisma.coPoMapping.create({
            data: {
              coId: createdCo.id,
              targetCode: map.targetCode,
              targetType: map.targetType,
              correlationLevel: map.correlationLevel
            }
          });
        }
      }

      // Duplicate Units & Topics
      for (const unit of sub.curriculumUnits) {
        const createdUnit = await prisma.curriculumUnit.create({
          data: {
            subjectId: createdSub.id,
            unitNumber: unit.unitNumber,
            name: unit.name,
            description: unit.description,
            totalHours: unit.totalHours
          }
        });

        for (const topic of unit.topics) {
          await prisma.curriculumTopic.create({
            data: {
              unitId: createdUnit.id,
              topicNumber: topic.topicNumber,
              title: topic.title,
              subTopics: topic.subTopics,
              learningOutcomes: topic.learningOutcomes
            }
          });
        }
      }
    }

    return duplicateReg;
  }

  // ==========================================
  // 2. SUBJECTS & HIERARCHY MANAGEMENT
  // ==========================================
  async getSubjects(params: {
    regulationId?: string;
    departmentId?: string;
    programId?: string;
    semesterId?: string;
    approvalStatus?: string;
    search?: string;
  }) {
    const where: any = { deleted: false };

    if (params.regulationId) where.regulationId = params.regulationId;
    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.programId) where.programId = params.programId;
    if (params.semesterId) where.semesterId = params.semesterId;
    if (params.approvalStatus) where.approvalStatus = params.approvalStatus;

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { code: { contains: params.search } }
      ];
    }

    return prisma.subject.findMany({
      where,
      include: {
        regulation: true,
        department: true,
        program: true,
        semester: true,
        assignedFaculty: { select: { id: true, firstName: true, lastName: true, email: true } },
        courseOutcomes: { include: { mappings: true } },
        curriculumUnits: { include: { topics: true } },
        materials: true,
        questionBankItems: true,
        labExperiments: true
      },
      orderBy: { code: 'asc' }
    });
  }

  async getSubjectDetails(id: string) {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        regulation: true,
        department: true,
        program: true,
        semester: true,
        assignedFaculty: true,
        courseOutcomes: {
          include: { mappings: true }
        },
        curriculumUnits: {
          include: {
            topics: true,
            materials: true
          }
        },
        materials: true,
        questionBankItems: true,
        labExperiments: true
      }
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async createSubject(data: any) {
    const existing = await prisma.subject.findFirst({ where: { code: data.code, deleted: false } });
    if (existing) throw new BadRequestException(`Subject with code ${data.code} already exists`);

    return prisma.subject.create({
      data: {
        name: data.name,
        code: data.code,
        credits: Number(data.credits) || 3,
        theoryHours: Number(data.theoryHours) || 3,
        practicalHours: Number(data.practicalHours) || 0,
        tutorialHours: Number(data.tutorialHours) || 0,
        internalMarks: Number(data.internalMarks) || 40,
        externalMarks: Number(data.externalMarks) || 60,
        passingMarks: Number(data.passingMarks) || 40,
        isElective: Boolean(data.isElective),
        isLab: Boolean(data.isLab),
        isCore: Boolean(data.isCore),
        isSkillBased: Boolean(data.isSkillBased),
        isOpenElective: Boolean(data.isOpenElective),
        isProfessionalElective: Boolean(data.isProfessionalElective),
        regulationId: data.regulationId,
        departmentId: data.departmentId,
        programId: data.programId,
        semesterId: data.semesterId,
        assignedFacultyId: data.assignedFacultyId,
        description: data.description,
        approvalStatus: 'DRAFT'
      }
    });
  }

  async updateSubject(id: string, data: any) {
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');

    return prisma.subject.update({
      where: { id },
      data
    });
  }

  async deleteSubject(id: string) {
    return prisma.subject.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() }
    });
  }

  // ==========================================
  // 3. COURSE OUTCOMES & CO-PO MAPPING
  // ==========================================
  async addCourseOutcome(subjectId: string, data: { code: string; description: string; bloomLevel: string; mappings?: any[] }) {
    const co = await prisma.courseOutcome.create({
      data: {
        subjectId,
        code: data.code,
        description: data.description,
        bloomLevel: data.bloomLevel
      }
    });

    if (data.mappings && Array.isArray(data.mappings)) {
      for (const map of data.mappings) {
        await prisma.coPoMapping.create({
          data: {
            coId: co.id,
            targetCode: map.targetCode,
            targetType: map.targetType || 'PO',
            correlationLevel: Number(map.correlationLevel) || 3
          }
        });
      }
    }

    return this.getSubjectDetails(subjectId);
  }

  async updateCourseOutcome(id: string, data: any) {
    await prisma.courseOutcome.update({
      where: { id },
      data: {
        code: data.code,
        description: data.description,
        bloomLevel: data.bloomLevel
      }
    });

    if (data.mappings && Array.isArray(data.mappings)) {
      await prisma.coPoMapping.deleteMany({ where: { coId: id } });
      for (const map of data.mappings) {
        await prisma.coPoMapping.create({
          data: {
            coId: id,
            targetCode: map.targetCode,
            targetType: map.targetType || 'PO',
            correlationLevel: Number(map.correlationLevel) || 3
          }
        });
      }
    }

    const co = await prisma.courseOutcome.findUnique({ where: { id } });
    return this.getSubjectDetails(co!.subjectId);
  }

  async deleteCourseOutcome(id: string) {
    const co = await prisma.courseOutcome.findUnique({ where: { id } });
    if (!co) throw new NotFoundException('Course Outcome not found');
    await prisma.courseOutcome.delete({ where: { id } });
    return this.getSubjectDetails(co.subjectId);
  }

  // ==========================================
  // 4. UNITS & TOPICS MANAGEMENT
  // ==========================================
  async addUnit(subjectId: string, data: { unitNumber: string; name: string; description?: string; totalHours?: number; topics?: any[] }) {
    const unit = await prisma.curriculumUnit.create({
      data: {
        subjectId,
        unitNumber: data.unitNumber,
        name: data.name,
        description: data.description,
        totalHours: Number(data.totalHours) || 9
      }
    });

    if (data.topics && Array.isArray(data.topics)) {
      for (const t of data.topics) {
        await prisma.curriculumTopic.create({
          data: {
            unitId: unit.id,
            topicNumber: t.topicNumber,
            title: t.title,
            subTopics: typeof t.subTopics === 'object' ? JSON.stringify(t.subTopics) : t.subTopics,
            learningOutcomes: t.learningOutcomes
          }
        });
      }
    }

    return this.getSubjectDetails(subjectId);
  }

  async addTopic(unitId: string, data: { topicNumber?: string; title: string; subTopics?: string; learningOutcomes?: string }) {
    const unit = await prisma.curriculumUnit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('Unit not found');

    await prisma.curriculumTopic.create({
      data: {
        unitId,
        topicNumber: data.topicNumber,
        title: data.title,
        subTopics: data.subTopics,
        learningOutcomes: data.learningOutcomes
      }
    });

    return this.getSubjectDetails(unit.subjectId);
  }

  // ==========================================
  // 5. STUDY MATERIALS, QUESTION BANKS & LABS
  // ==========================================
  async addMaterial(data: {
    subjectId: string;
    unitId?: string;
    topicId?: string;
    title: string;
    type: string;
    url: string;
    authorName?: string;
  }) {
    return prisma.curriculumMaterial.create({
      data
    });
  }

  async addQuestionBankItem(data: {
    subjectId: string;
    unitId?: string;
    category: string;
    question: string;
    options?: string;
    answer?: string;
    bloomLevel?: string;
    difficulty?: string;
    year?: string;
  }) {
    return prisma.questionBankItem.create({
      data: {
        ...data,
        difficulty: data.difficulty || 'MEDIUM'
      }
    });
  }

  async addLabExperiment(data: {
    subjectId: string;
    expNumber: number;
    title: string;
    objective?: string;
    equipment?: string;
    procedure?: string;
    vivaQuestions?: string;
    manualUrl?: string;
    simulationUrl?: string;
  }) {
    return prisma.labExperiment.create({
      data
    });
  }

  // ==========================================
  // 6. APPROVAL WORKFLOW & PUBLISHING
  // ==========================================
  async updateApprovalStatus(subjectId: string, status: 'DRAFT' | 'SUBMITTED_TO_HOD' | 'HOD_APPROVED' | 'DEAN_APPROVED' | 'PUBLISHED') {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException('Subject not found');

    return prisma.subject.update({
      where: { id: subjectId },
      data: { approvalStatus: status }
    });
  }

  async publishCurriculum(regulationId: string) {
    const reg = await prisma.regulation.findUnique({ where: { id: regulationId } });
    if (!reg) throw new NotFoundException('Regulation not found');

    // Update all subjects under regulation to PUBLISHED
    await prisma.subject.updateMany({
      where: { regulationId },
      data: { approvalStatus: 'PUBLISHED', status: 'ACTIVE' }
    });

    return prisma.regulation.update({
      where: { id: regulationId },
      data: { status: 'PUBLISHED', isCurrent: true }
    });
  }

  // ==========================================
  // 7. STUDENT & FACULTY DYNAMIC VIEWS
  // ==========================================
  async getStudentCurriculumView(studentUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: studentUserId },
      include: {
        student: {
          include: {
            semester: true,
            department: true,
            program: true
          }
        }
      }
    });

    if (!user || !user.student) {
      // Return empty database state as specified in requirements
      return {
        semester: null,
        subjects: []
      };
    }

    const student = user.student;

    const subjects = await prisma.subject.findMany({
      where: {
        semesterId: student.semesterId,
        departmentId: student.departmentId,
        programId: student.programId,
        deleted: false,
        approvalStatus: 'PUBLISHED'
      },
      include: {
        courseOutcomes: { include: { mappings: true } },
        curriculumUnits: { include: { topics: true, materials: true } },
        materials: true,
        questionBankItems: true,
        labExperiments: true
      }
    });

    return {
      semester: student.semester,
      department: student.department,
      program: student.program,
      subjects
    };
  }

  // ==========================================
  // 8. INTELLIGENT PDF PARSER DEMO ENGINE
  // ==========================================
  async parsePdfSyllabus(rawText: string) {
    // Basic regex intelligence to auto-detect structure from raw extracted text
    const courseCodeMatch = rawText.match(/Course Code\s*:\s*([A-Z0-9]+)/i) || rawText.match(/([A-Z]{2,4}\d{4})/);
    const courseNameMatch = rawText.match(/Course Title\s*:\s*([^\n]+)/i) || rawText.match(/Subject\s*:\s*([^\n]+)/i);
    const creditsMatch = rawText.match(/Credits?\s*:\s*(\d+)/i);
    
    // Extract units
    const unitMatches = Array.from(rawText.matchAll(/UNIT\s+([I|V|X]+)\s+-\s+([^\n]+)\n([\s\S]*?)(?=UNIT\s+[I|V|X]+|$)/gi));
    
    const units = unitMatches.map((m) => ({
      unitNumber: `UNIT ${m[1]}`,
      name: m[2].trim(),
      topics: m[3].trim().split('. ').map(t => t.trim()).filter(Boolean)
    }));

    return {
      detectedCode: courseCodeMatch ? courseCodeMatch[1] : 'CS2026',
      detectedName: courseNameMatch ? courseNameMatch[1].trim() : 'Advanced Intelligent Systems',
      detectedCredits: creditsMatch ? parseInt(creditsMatch[1]) : 4,
      unitsDetected: units.length > 0 ? units : [
        { unitNumber: 'UNIT I', name: 'Foundations & Concepts', topics: ['Introduction to Core Principles', 'Architectural Foundations'] },
        { unitNumber: 'UNIT II', name: 'Advanced Methodologies', topics: ['Algorithmic Structures', 'Optimization Strategies'] }
      ]
    };
  }
}
