import { Router } from 'express';
import { IamController } from './iam.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new IamController();

router.use(requireAuth as any);

router.get('/my-iam', controller.getMyIAM as any);
router.get('/directory', controller.getMasterUserDirectory as any);
router.get('/designations', controller.getDesignations as any);
router.post('/designations', controller.createDesignation as any);
router.get('/committees', controller.getCommittees as any);
router.post('/committees', controller.createCommittee as any);
router.post('/committees/assign', controller.assignUserToCommittee as any);
router.get('/delegations', controller.getDelegations as any);
router.post('/delegations', controller.createDelegation as any);
router.post('/delegations/:id/revoke', controller.revokeDelegation as any);

export default router;
