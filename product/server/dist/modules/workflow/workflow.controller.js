"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const workflow_service_1 = require("./workflow.service");
const workflow_engine_service_1 = require("./workflow-engine.service");
const security_1 = require("../../utils/security");
const engine = new workflow_engine_service_1.WorkflowEngineService();
class WorkflowController {
    service = new workflow_service_1.WorkflowService();
    createRequest = async (req, res, next) => {
        try {
            const user = req.user;
            const { type, title, reason, startDate, endDate, attachments } = req.body;
            const data = await this.service.createRequest(user.email, type, title, reason, startDate, endDate, attachments);
            await (0, security_1.auditRequest)(req, 'CREATE', 'WORKFLOW', `Submitted ${type} request: ${title}`, data?.id, 'WorkflowRequest');
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
            const roleName = typeof user.role === 'object' && user.role !== null ? user.role.name : user.role;
            const data = await this.service.listRequests(user.email, roleName, status);
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
            const roleName = typeof user.role === 'object' && user.role !== null ? user.role.name : user.role;
            const data = await this.service.takeAction(id, user.email, roleName, action, comment);
            await (0, security_1.auditRequest)(req, action.toUpperCase(), 'WORKFLOW', `${action} workflow request: ${comment || 'No comment'}`, id, 'WorkflowRequest');
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    cancelRequest = async (req, res, next) => {
        try {
            const user = req.user;
            const { id } = req.params;
            const data = await this.service.cancelRequest(id, user.email);
            await (0, security_1.auditRequest)(req, 'CANCEL', 'WORKFLOW', `Cancelled workflow request`, id, 'WorkflowRequest');
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    listDefinitions = async (req, res, next) => {
        try {
            const moduleName = req.query.module;
            const data = await engine.listDefinitions(moduleName);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    getDefinition = async (req, res, next) => {
        try {
            const data = await engine.getActiveDefinition(req.params.module);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    createOrUpdateDefinition = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await engine.createOrUpdateDefinition({
                ...req.body,
                configuredById: user.id,
            });
            await (0, security_1.auditRequest)(req, 'CREATE_DEFINITION', 'WORKFLOW', `Configured workflow definition for ${req.body.module}`, data.id, 'WorkflowDefinition');
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    toggleDefinitionActive = async (req, res, next) => {
        try {
            const data = await engine.toggleActive(req.params.id, req.body.isActive);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.WorkflowController = WorkflowController;
//# sourceMappingURL=workflow.controller.js.map