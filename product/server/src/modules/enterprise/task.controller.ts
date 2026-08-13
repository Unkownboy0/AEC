import { Request, Response, NextFunction } from 'express';
import { TaskService } from './task.service';
import { TaskEngineService } from './task-engine.service';

const taskService = new TaskService();

export class TaskController {
  static async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const createdById = (req as any).user.id;
      const activeRole = (req as any).user.role;
      const task = await TaskEngineService.createTask(createdById, req.body, activeRole);
      res.status(201).json({ status: 'success', data: task });
    } catch (error) {
      next(error);
    }
  }

  static async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const result = await taskService.getTasks(userId, userRole, req.query as any);
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getKanbanBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const result = await taskService.getTasks(userId, userRole, {
        departmentId: (req.query.departmentId as string) || (req as any).departmentId,
        limit: 100,
      });
      const columns: Record<string, any[]> = {
        NOT_SEEN: [], SEEN: [], ACCEPTED: [], IN_PROGRESS: [], WAITING_APPROVAL: [], COMPLETED: [], REJECTED: [],
      };
      const requestedAssignee = req.query.assigneeId as string | undefined;
      result.data
        .filter((task: any) => !requestedAssignee || task.assignees.some((item: any) => item.assigneeId === requestedAssignee))
        .forEach((task: any) => (columns[task.status] || columns.NOT_SEEN).push(task));
      res.status(200).json({ status: 'success', data: { totalTasks: result.meta.total, columns } });
    } catch (error) {
      next(error);
    }
  }

  static async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const task = await taskService.getTaskById(req.params.taskId, userId, userRole);
      res.status(200).json({ status: 'success', data: task });
    } catch (error) {
      next(error);
    }
  }

  static async updateTaskStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { status, comment } = req.body;
      const task = await taskService.updateTaskStatus(req.params.taskId, userId, status, comment);
      res.status(200).json({ status: 'success', data: task });
    } catch (error) {
      next(error);
    }
  }

  static async updateChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { checklist } = req.body;
      const task = await TaskEngineService.updateChecklist(req.params.taskId, userId, checklist || []);
      res.status(200).json({ status: 'success', data: task });
    } catch (error) {
      next(error);
    }
  }

  static async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { completionPercent, comment } = req.body;
      const task = await taskService.updateProgress(req.params.taskId, userId, { completionPercent, comment });
      res.status(200).json({ status: 'success', data: task });
    } catch (error) {
      next(error);
    }
  }

  static async getWorkloadAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const departmentId = (req.query.departmentId as string) || (req as any).departmentId;
      const data = await TaskEngineService.getWorkloadAnalytics(departmentId);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as string;
      const templates = await TaskEngineService.getTemplates(category);
      res.status(200).json({ status: 'success', data: templates });
    } catch (error) {
      next(error);
    }
  }

  static async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await TaskEngineService.createTemplate(req.body);
      res.status(201).json({ status: 'success', data: template });
    } catch (error) {
      next(error);
    }
  }

  static async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { content, parentId } = req.body;
      const comment = await taskService.addComment(req.params.taskId, userId, content, parentId);
      res.status(201).json({ status: 'success', data: comment });
    } catch (error) {
      next(error);
    }
  }
}
