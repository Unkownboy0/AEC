import { Request, Response, NextFunction } from 'express';
import { workspaceDriveService } from './workspace-drive.service';

const uid = (req: Request) => (req as any).user.id as string;
const meta = (req: Request) => ({ ip: req.ip, userAgent: req.headers['user-agent'] as string | undefined });

export class WorkspaceDriveController {
  listFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { view, folderId, type, q, dateFrom, dateTo } = req.query as Record<string, string | undefined>;
      res.status(200).json({ status: 'success', data: await workspaceDriveService.listFiles(uid(req), { view, folderId, type, q, dateFrom, dateTo }) });
    } catch (error) { next(error); }
  };

  listFolders = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDriveService.listFolders(uid(req), req.query.parentId as string | undefined) }); } catch (error) { next(error); }
  };

  createFolder = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ status: 'success', data: await workspaceDriveService.createFolder(uid(req), req.body, meta(req)) }); } catch (error) { next(error); }
  };

  renameFolder = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDriveService.renameFolder(uid(req), req.params.id, req.body.name, meta(req)) }); } catch (error) { next(error); }
  };

  trashFolder = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDriveService.trashFolder(uid(req), req.params.id, meta(req)) }); } catch (error) { next(error); }
  };

  getFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { file, access } = await workspaceDriveService.getFileWithAccess(uid(req), req.params.id);
      res.status(200).json({ status: 'success', data: { ...file, access } });
    } catch (error) { next(error); }
  };

  renameFile = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDriveService.renameFile(uid(req), req.params.id, req.body.name, meta(req)) }); } catch (error) { next(error); }
  };

  moveFile = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDriveService.moveFile(uid(req), req.params.id, req.body.folderId ?? null, meta(req)) }); } catch (error) { next(error); }
  };

  archiveFile = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDriveService.archiveFile(uid(req), req.params.id, Boolean(req.body.archived), meta(req)) }); } catch (error) { next(error); }
  };

  trashFile = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDriveService.trashFile(uid(req), req.params.id, meta(req)) }); } catch (error) { next(error); }
  };

  restoreFile = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDriveService.restoreFile(uid(req), req.params.id, meta(req)) }); } catch (error) { next(error); }
  };

  toggleStar = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDriveService.toggleStar(uid(req), req.params.id, Boolean(req.body.starred)) }); } catch (error) { next(error); }
  };

  listShares = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDriveService.listShares(uid(req), req.params.id) }); } catch (error) { next(error); }
  };

  share = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ status: 'success', data: await workspaceDriveService.share(uid(req), req.params.id, req.body, meta(req)) }); } catch (error) { next(error); }
  };

  removeShare = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDriveService.removeShare(uid(req), req.params.id, req.params.shareId, meta(req)) }); } catch (error) { next(error); }
  };

  upload = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ status: 'success', data: await workspaceDriveService.upload(uid(req), req.body, meta(req)) }); } catch (error) { next(error); }
  };

  download = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { physicalPath, name, mimeType } = await workspaceDriveService.download(uid(req), req.params.id);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/["\\\r\n]/g, '_')}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.sendFile(physicalPath);
    } catch (error) { next(error); }
  };
}
