import { prisma } from '../../lib/prisma';
import { HodTaskRepository } from './hod-task.repository';
import { logger } from '../../utils/logger';

const repo = new HodTaskRepository();

export class HodTaskService {
  /**
   * Get HOD task dashboard (summary cards + queue list).
   */
  static async getHodTaskDashboard(userId: string, filterStatus?: string) {
    const [summary, queue] = await Promise.all([
      repo.getHodTaskSummary(userId),
      repo.findTasksForHod(userId, filterStatus),
    ]);
    return { summary, queue };
  }

  /**
   * Get single task detail.
   */
  static async getTaskById(taskId: string, userId: string) {
    const task = await repo.findById(taskId);
    if (!task) return null;

    // Mark as VIEWED if initial view
    if (task.status === 'ASSIGNED' || task.status === 'DELIVERED') {
      await repo.update(taskId, {
        status: 'VIEWED',
        viewedAt: new Date(),
      }).catch(() => {});
    }

    return task;
  }

  /**
   * HOD acknowledges task.
   */
  static async acknowledgeTask(taskId: string, userId: string) {
    return repo.update(taskId, {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
    });
  }

  /**
   * HOD starts task (status -> IN_PROGRESS).
   */
  static async startTask(taskId: string, userId: string) {
    return repo.update(taskId, {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    });
  }

  /**
   * HOD updates progress percentage.
   */
  static async updateProgress(taskId: string, userId: string, progress: number, remarks?: string) {
    return repo.update(taskId, {
      progress: Math.min(100, Math.max(0, progress)),
      status: progress === 100 ? 'SUBMITTED' : 'IN_PROGRESS',
      remarks: remarks || undefined,
    });
  }

  /**
   * HOD raises a query to Dean/creator.
   */
  static async raiseQuery(taskId: string, userId: string, queryText: string) {
    return repo.update(taskId, {
      status: 'QUERY_RAISED',
      queryText,
      queryRaisedAt: new Date(),
    });
  }

  /**
   * HOD submits completed task with submission files/links.
   */
  static async submitTask(taskId: string, userId: string, submissionUrl?: string, submissionNotes?: string) {
    return repo.update(taskId, {
      status: 'SUBMITTED',
      progress: 100,
      submissionUrl: submissionUrl || null,
      submissionNotes: submissionNotes || null,
      submittedAt: new Date(),
    });
  }
}
