"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentsController = void 0;
const departments_service_1 = require("./departments.service");
const academics_validator_1 = require("./academics.validator");
const exceptions_1 = require("../../utils/exceptions");
class DepartmentsController {
    service = new departments_service_1.DepartmentsService();
    list = async (req, res, next) => {
        try {
            const result = await this.service.listDepartments(req.query);
            res.status(200).json({
                status: 'success',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    };
    get = async (req, res, next) => {
        try {
            const dept = await this.service.getDepartment(req.params.id);
            res.status(200).json({
                status: 'success',
                data: dept
            });
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const validation = academics_validator_1.createDepartmentSchema.safeParse(req.body);
            if (!validation.success) {
                throw new exceptions_1.BadRequestException(validation.error.errors[0].message);
            }
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            const dept = await this.service.createDepartment(validation.data, req.user.id, ip, ua);
            res.status(201).json({
                status: 'success',
                data: dept
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const validation = academics_validator_1.updateDepartmentSchema.safeParse(req.body);
            if (!validation.success) {
                throw new exceptions_1.BadRequestException(validation.error.errors[0].message);
            }
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            const dept = await this.service.updateDepartment(req.params.id, validation.data, req.user.id, ip, ua);
            res.status(200).json({
                status: 'success',
                data: dept
            });
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            await this.service.deleteDepartment(req.params.id, req.user.id, ip, ua);
            res.status(200).json({
                status: 'success',
                message: 'Department soft deleted successfully'
            });
        }
        catch (error) {
            next(error);
        }
    };
    restore = async (req, res, next) => {
        try {
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            await this.service.restoreDepartment(req.params.id, req.user.id, ip, ua);
            res.status(200).json({
                status: 'success',
                message: 'Department restored successfully'
            });
        }
        catch (error) {
            next(error);
        }
    };
    bulkDelete = async (req, res, next) => {
        try {
            const { ids } = req.body;
            if (!Array.isArray(ids) || ids.length === 0) {
                throw new exceptions_1.BadRequestException('Department IDs array is required');
            }
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            await this.service.bulkDelete(ids, req.user.id, ip, ua);
            res.status(200).json({
                status: 'success',
                message: 'Departments bulk soft deleted'
            });
        }
        catch (error) {
            next(error);
        }
    };
    bulkArchive = async (req, res, next) => {
        try {
            const { ids } = req.body;
            if (!Array.isArray(ids) || ids.length === 0) {
                throw new exceptions_1.BadRequestException('Department IDs array is required');
            }
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            await this.service.bulkArchive(ids, req.user.id, ip, ua);
            res.status(200).json({
                status: 'success',
                message: 'Departments bulk archived'
            });
        }
        catch (error) {
            next(error);
        }
    };
    import = async (req, res, next) => {
        try {
            const { rows } = req.body;
            if (!Array.isArray(rows)) {
                throw new exceptions_1.BadRequestException('Rows array is required for import');
            }
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            const result = await this.service.importDepartments(rows, req.user.id, ip, ua);
            res.status(200).json({
                status: 'success',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.DepartmentsController = DepartmentsController;
//# sourceMappingURL=departments.controller.js.map