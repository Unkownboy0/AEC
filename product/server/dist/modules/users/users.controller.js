"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const users_service_1 = require("./users.service");
const provisioning_service_1 = require("./provisioning.service");
const provisioning_validator_1 = require("./provisioning.validator");
class UsersController {
    service = new users_service_1.UsersService();
    provisioning = new provisioning_service_1.ProvisioningService();
    previewImport = async (req, res, next) => {
        try {
            const { rows } = provisioning_validator_1.provisioningRequestSchema.parse(req.body);
            res.status(200).json({ status: 'success', data: await this.provisioning.preview(rows) });
        }
        catch (error) {
            next(error);
        }
    };
    commitImport = async (req, res, next) => {
        try {
            const { rows } = provisioning_validator_1.provisioningRequestSchema.parse(req.body);
            const data = await this.provisioning.commit(rows, req.user.id, req.ip, req.headers['user-agent']);
            res.status(data.invalid ? 409 : 201).json({ status: data.invalid ? 'error' : 'success', data, message: data.invalid ? 'Import contains validation errors; no records were created.' : 'Accounts provisioned successfully.' });
        }
        catch (error) {
            next(error);
        }
    };
    previewImportFile = async (req, res, next) => {
        try {
            const input = provisioning_validator_1.provisioningFileRequestSchema.parse(req.body);
            const rows = await this.provisioning.parseFile(input.fileName, input.base64);
            res.status(200).json({ status: 'success', data: await this.provisioning.preview(rows) });
        }
        catch (error) {
            next(error);
        }
    };
    commitImportFile = async (req, res, next) => {
        try {
            const input = provisioning_validator_1.provisioningFileRequestSchema.parse(req.body);
            const rows = await this.provisioning.parseFile(input.fileName, input.base64);
            const data = await this.provisioning.commit(rows, req.user.id, req.ip, req.headers['user-agent']);
            const statusCode = data.invalid ? 409 : data.failed ? 207 : 201;
            res.status(statusCode).json({ status: data.invalid ? 'error' : 'success', data, message: data.invalid ? 'Import contains validation errors; no records were created.' : data.failed ? 'Import completed with row-level failures.' : 'Accounts provisioned successfully.' });
        }
        catch (error) {
            next(error);
        }
    };
    list = async (req, res, next) => {
        try {
            const result = await this.service.listUsers(req.query, req.user);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const result = await this.service.getUserById(req.params.id, req.user);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            const result = await this.service.createUser(req.body, currentUserId, ip, ua);
            res.status(201).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            const result = await this.service.updateUser(req.params.id, req.body, currentUserId, ip, ua);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            await this.service.deleteUser(req.params.id, currentUserId, ip, ua);
            res.status(200).json({
                status: 'success',
                message: 'User deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
    resetPassword = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const { newPassword } = req.body;
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            if (!newPassword || newPassword.length < 6) {
                res.status(400).json({
                    status: 'error',
                    message: 'Password must be at least 6 characters long',
                });
                return;
            }
            await this.service.resetUserPassword(req.params.id, newPassword, currentUserId, ip, ua);
            res.status(200).json({
                status: 'success',
                message: 'Password reset successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
    import = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const { rows } = req.body;
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            if (!Array.isArray(rows)) {
                res.status(400).json({
                    status: 'error',
                    message: 'Rows array is required in request body',
                });
                return;
            }
            const result = await this.service.bulkImport(rows, currentUserId, ip, ua);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    updateProfile = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            const result = await this.service.updateProfile(currentUserId, req.body, ip, ua);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getDirectoryStats = async (req, res, next) => {
        try {
            const stats = await this.service.getDirectoryStats();
            res.status(200).json({
                status: 'success',
                data: { stats }
            });
        }
        catch (error) {
            next(error);
        }
    };
    generateCredentials = async (req, res, next) => {
        try {
            const creds = await this.service.generateCredentials(req.body);
            res.status(200).json({
                status: 'success',
                data: creds
            });
        }
        catch (error) {
            next(error);
        }
    };
    assignSubjects = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            const result = await this.service.assignSubjects(req.body, currentUserId, ip, ua);
            res.status(200).json({ status: 'success', data: result });
        }
        catch (error) {
            next(error);
        }
    };
    assignMentor = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            const result = await this.service.assignMentor(req.body, currentUserId, ip, ua);
            res.status(200).json({ status: 'success', data: result });
        }
        catch (error) {
            next(error);
        }
    };
    regenerateUserCredentials = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            const result = await this.service.regenerateCredentials(req.params.id, currentUserId, ip, ua);
            res.status(200).json({ status: 'success', data: result });
        }
        catch (error) {
            next(error);
        }
    };
    unlockUserAccount = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const ip = req.ip || req.socket.remoteAddress;
            const ua = req.headers['user-agent'];
            const result = await this.service.unlockUserAccount(req.params.id, currentUserId, ip, ua);
            res.status(200).json({ status: 'success', data: result });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.UsersController = UsersController;
//# sourceMappingURL=users.controller.js.map