import { Router } from 'express';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { WorkspaceDriveController } from './workspace-drive.controller';
import { WorkspaceDocsController } from './workspace-docs.controller';

const router = Router();
const drive = new WorkspaceDriveController();
const docs = new WorkspaceDocsController();

router.use(requireAuth);

// Drive
router.get('/files', drive.listFiles);
router.get('/files/:id', drive.getFile);
router.patch('/files/:id', drive.renameFile);
router.post('/files/:id/move', drive.moveFile);
router.post('/files/:id/archive', drive.archiveFile);
router.delete('/files/:id', drive.trashFile);
router.post('/files/:id/restore', drive.restoreFile);
router.post('/files/:id/star', drive.toggleStar);
router.get('/files/:id/shares', drive.listShares);
router.post('/files/:id/shares', drive.share);
router.delete('/files/:id/shares/:shareId', drive.removeShare);
router.get('/files/:id/download', drive.download);
router.post('/upload', drive.upload);

router.get('/folders', drive.listFolders);
router.post('/folders', drive.createFolder);
router.patch('/folders/:id', drive.renameFolder);
router.delete('/folders/:id', drive.trashFolder);

// Campus Docs
router.get('/doc-templates', docs.templates);
router.get('/merge-fields', docs.mergeFields);
router.post('/documents', docs.create);
router.get('/documents/:id', docs.get);
router.put('/documents/:id/content', docs.saveContent);
router.post('/documents/:id/versions', docs.saveVersion);
router.get('/documents/:id/versions', docs.listVersions);
router.post('/documents/:id/versions/:version/restore', docs.restoreVersion);
router.post('/documents/:id/refresh-fields', docs.refreshMergeFields);
router.get('/documents/:id/comments', docs.listComments);
router.post('/documents/:id/comments', docs.addComment);
router.patch('/documents/:id/comments/:commentId', docs.resolveComment);
router.post('/documents/:id/status', docs.setStatus);
router.get('/documents/:id/export.pdf', docs.exportPdf);

export default router;
