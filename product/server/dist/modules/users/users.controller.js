"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const users_service_1 = require("./users.service");
class UsersController {
    service = new users_service_1.UsersService();
    list = async (req, res, next) => {
        try {
            const result = await this.service.listUsers(req.query);
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
}
exports.UsersController = UsersController;
//# sourceMappingURL=users.controller.js.map