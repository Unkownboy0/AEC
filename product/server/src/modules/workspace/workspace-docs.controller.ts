import { Request, Response, NextFunction } from 'express';
import { workspaceDocsService } from './workspace-docs.service';
import { renderDocToPdf } from './doc-pdf.service';
import { DOC_TEMPLATES } from './workspace-templates';
import { resolveMergeFields } from './workspace-merge-fields';
import { loadActorContext } from './workspace-context';

const uid = (req: Request) => (req as any).user.id as string;
const meta = (req: Request) => ({ ip: req.ip, userAgent: req.headers['user-agent'] as string | undefined });

export class WorkspaceDocsController {
  templates = async (_req: Request, res: Response) => {
    res.status(200).json({ status: 'success', data: DOC_TEMPLATES.map(({ html: _html, ...t }) => t) });
  };

  mergeFields = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = await loadActorContext(uid(req));
      res.status(200).json({ status: 'success', data: await resolveMergeFields(ctx) });
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ status: 'success', data: await workspaceDocsService.create(uid(req), req.body, meta(req)) }); } catch (error) { next(error); }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDocsService.get(uid(req), req.params.id) }); } catch (error) { next(error); }
  };

  saveContent = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDocsService.saveContent(uid(req), req.params.id, req.body.content) }); } catch (error) { next(error); }
  };

  saveVersion = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ status: 'success', data: await workspaceDocsService.saveVersion(uid(req), req.params.id, req.body.changeNote, meta(req)) }); } catch (error) { next(error); }
  };

  listVersions = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDocsService.listVersions(uid(req), req.params.id) }); } catch (error) { next(error); }
  };

  restoreVersion = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDocsService.restoreVersion(uid(req), req.params.id, Number(req.params.version), meta(req)) }); } catch (error) { next(error); }
  };

  refreshMergeFields = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDocsService.refreshMergeFields(uid(req), req.params.id) }); } catch (error) { next(error); }
  };

  listComments = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDocsService.listComments(uid(req), req.params.id) }); } catch (error) { next(error); }
  };

  addComment = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ status: 'success', data: await workspaceDocsService.addComment(uid(req), req.params.id, req.body.body, req.body.parentId, meta(req)) }); } catch (error) { next(error); }
  };

  resolveComment = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDocsService.resolveComment(uid(req), req.params.id, req.params.commentId, Boolean(req.body.resolved)) }); } catch (error) { next(error); }
  };

  setStatus = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await workspaceDocsService.setStatus(uid(req), req.params.id, req.body.status, req.body.note, meta(req)) }); } catch (error) { next(error); }
  };

  exportPdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await workspaceDocsService.get(uid(req), req.params.id); // access check
      const { margin, watermark, qr } = req.query as Record<string, string | undefined>;
      const pdf = await renderDocToPdf(req.params.id, { margin: margin as 'normal' | 'narrow', watermark: watermark === 'true', qr: qr !== 'false' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
      res.send(pdf);
    } catch (error) { next(error); }
  };
}
