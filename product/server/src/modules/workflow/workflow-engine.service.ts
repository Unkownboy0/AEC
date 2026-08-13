import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';

export interface WorkflowStepDef {
  step: string;               // MENTOR, HOD, DEAN, PRINCIPAL, OFFICE, FINANCE
  role: string;               // Mentor, HOD, Academic Dean, Principal, etc.
  sequence: number;           // 1, 2, 3, ...
  assigneeType?: string;      // INDIVIDUAL, ROLE, DEPARTMENT_HEAD
  slaHours?: number;          // SLA in hours
  autoApproveOnSla?: boolean;
}

export interface WorkflowConditionRule {
  minDays?: number;
  maxDays?: number;
  minAmount?: number;
  maxAmount?: number;
  requirePrincipalApproval?: boolean;
  skipMentorIfExecutive?: boolean;
}

export class WorkflowEngineService {
  /**
   * List workflow definitions with filters
   */
  async listDefinitions(module?: string) {
    const where: any = {};
    if (module) where.module = module;
    return prisma.workflowDefinition.findMany({
      where,
      orderBy: [{ module: 'asc' }, { version: 'desc' }],
    });
  }

  /**
   * Get active workflow definition for a module
   */
  async getActiveDefinition(module: string) {
    return prisma.workflowDefinition.findFirst({
      where: { module: module.toUpperCase(), isActive: true },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Create or update workflow definition with automatic versioning.
   */
  async createOrUpdateDefinition(data: {
    code: string;
    name: string;
    module: string;
    description?: string;
    steps: WorkflowStepDef[];
    conditions?: WorkflowConditionRule;
    configuredById: string;
  }) {
    if (!data.steps || data.steps.length === 0) {
      throw new BadRequestException('Workflow definition must contain at least one step');
    }

    const code = data.code.toUpperCase();
    const moduleName = data.module.toUpperCase();

    // Check for existing versions
    const existing = await prisma.workflowDefinition.findMany({
      where: { code },
      orderBy: { version: 'desc' },
    });

    const nextVersion = existing.length > 0 ? existing[0].version + 1 : 1;

    // Deactivate previous active versions if any
    if (existing.length > 0) {
      await prisma.workflowDefinition.updateMany({
        where: { code, isActive: true },
        data: { isActive: false },
      });
    }

    const sortedSteps = [...data.steps].sort((a, b) => a.sequence - b.sequence);

    return prisma.workflowDefinition.create({
      data: {
        code,
        name: data.name,
        module: moduleName,
        description: data.description,
        steps: JSON.stringify(sortedSteps),
        conditions: JSON.stringify(data.conditions || {}),
        version: nextVersion,
        isActive: true,
        configuredById: data.configuredById,
      },
    });
  }

  /**
   * Toggle activation status of a workflow definition
   */
  async toggleActive(id: string, isActive: boolean) {
    const def = await prisma.workflowDefinition.findUnique({ where: { id } });
    if (!def) throw new NotFoundException('Workflow definition not found');

    if (isActive) {
      // Deactivate other versions of same code
      await prisma.workflowDefinition.updateMany({
        where: { code: def.code, id: { not: id } },
        data: { isActive: false },
      });
    }

    return prisma.workflowDefinition.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * Dynamically resolve next step & status in a multi-stage workflow.
   */
  async resolveNextStep(params: {
    module: string;
    currentStep: string;
    action: 'APPROVE' | 'REJECT' | 'FORWARD';
    context?: {
      totalDays?: number;
      amount?: number;
      requesterRole?: string;
    };
  }) {
    const { module: moduleName, currentStep, action, context } = params;

    if (action === 'REJECT') {
      return {
        nextStep: 'COMPLETED',
        nextStatus: `REJECTED_BY_${currentStep}`,
        isFinal: true,
        roleRequired: null,
      };
    }

    // Attempt to load active definition
    const activeDef = await this.getActiveDefinition(moduleName);

    if (activeDef && activeDef.steps) {
      try {
        const steps: WorkflowStepDef[] = JSON.parse(activeDef.steps);
        const conditions: WorkflowConditionRule = JSON.parse(activeDef.conditions || '{}');

        steps.sort((a, b) => a.sequence - b.sequence);

        const currentIndex = steps.findIndex((s) => s.step.toUpperCase() === currentStep.toUpperCase());

        if (currentIndex !== -1 && currentIndex < steps.length - 1) {
          let nextStepDef = steps[currentIndex + 1];

          // Evaluate condition rules
          if (conditions.maxDays && context?.totalDays && context.totalDays > conditions.maxDays) {
            // Escalate if total days exceeds threshold
            const escalated = steps.find((s) => s.sequence > nextStepDef.sequence);
            if (escalated) nextStepDef = escalated;
          }

          return {
            nextStep: nextStepDef.step,
            nextStatus: `${currentStep}_APPROVED`,
            isFinal: false,
            roleRequired: nextStepDef.role,
          };
        } else {
          // Reached final step in definition
          return {
            nextStep: 'COMPLETED',
            nextStatus: 'APPROVED',
            isFinal: true,
            roleRequired: null,
          };
        }
      } catch (e) {
        // Fallback to standard transition if JSON parsing fails
      }
    }

    // Default Fallback Routing
    if (currentStep === 'MENTOR') {
      return { nextStep: 'HOD', nextStatus: 'MENTOR_APPROVED', isFinal: false, roleRequired: 'HOD' };
    } else if (currentStep === 'HOD') {
      if (context?.totalDays && context.totalDays > 3) {
        return { nextStep: 'PRINCIPAL', nextStatus: 'HOD_APPROVED', isFinal: false, roleRequired: 'Principal' };
      }
      return { nextStep: 'COMPLETED', nextStatus: 'APPROVED', isFinal: true, roleRequired: null };
    } else if (currentStep === 'DEAN' || currentStep === 'PRINCIPAL') {
      return { nextStep: 'COMPLETED', nextStatus: 'APPROVED', isFinal: true, roleRequired: null };
    }

    return { nextStep: 'COMPLETED', nextStatus: 'APPROVED', isFinal: true, roleRequired: null };
  }
}
