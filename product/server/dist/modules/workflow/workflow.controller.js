"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const workflow_service_1 = require("./workflow.service");
class WorkflowController {
    service = new workflow_service_1.WorkflowService();
    createRequest = async (req, res, next) => {
        try {
            const user = req.user;
            const { type, title, reason, startDate, endDate, attachments } = req.body;
            const data = await this.service.createRequest(user.email, type, title, reason, startDate, endDate, attachments);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    listRequests = async (req, res, next) => {
        try {
            const user = req.user;
            const { status } = req.query;
            const data = await this.service.listRequests(user.email, user.role, status);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    takeAction = async (req, res, next) => {
        try {
            const user = req.user;
            const { id } = req.params;
            const { action, comment } = req.body;
            const data = await this.service.takeAction(id, user.email, user.role, action, comment);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.WorkflowController = WorkflowController;
//# sourceMappingURL=workflow.controller.js.map