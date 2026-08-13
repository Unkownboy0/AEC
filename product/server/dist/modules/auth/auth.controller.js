"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const auth_validator_1 = require("./auth.validator");
class AuthController {
    service = new auth_service_1.AuthService();
    login = async (req, res, next) => {
        try {
            const validated = auth_validator_1.loginSchema.parse(req.body);
            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];
            const result = await this.service.login(validated, ipAddress, userAgent);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    refresh = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    status: 'error',
                    message: 'Refresh token is required',
                });
                return;
            }
            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];
            const result = await this.service.refresh(refreshToken, ipAddress, userAgent);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    logout = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                await this.service.logout(refreshToken);
            }
            res.status(200).json({
                status: 'success',
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
    logoutAll = async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ status: 'error', message: 'Unauthorized' });
                return;
            }
            await this.service.logoutAll(req.user.id);
            res.status(200).json({
                status: 'success',
                message: 'All device sessions terminated successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
    getMe = async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ status: 'error', message: 'Unauthorized' });
                return;
            }
            const result = await this.service.getMe(req.user.id, req.user.role);
            res.status(200).json({
                status: 'success',
                data: { user: result },
            });
        }
        catch (error) {
            next(error);
        }
    };
    changePassword = async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ status: 'error', message: 'Unauthorized' });
                return;
            }
            const validated = auth_validator_1.changePasswordSchema.parse(req.body);
            await this.service.changePassword(req.user.id, validated);
            res.status(200).json({
                status: 'success',
                message: 'Password changed successfully. All other active sessions terminated.',
            });
        }
        catch (error) {
            next(error);
        }
    };
    forgotPassword = async (req, res, next) => {
        try {
            const validated = auth_validator_1.forgotPasswordSchema.parse(req.body);
            await this.service.forgotPassword(validated.email);
            res.status(200).json({
                status: 'success',
                message: 'If the account exists, reset instructions will be sent.',
                data: null,
            });
        }
        catch (error) {
            next(error);
        }
    };
    resetPassword = async (req, res, next) => {
        try {
            const validated = auth_validator_1.resetPasswordSchema.parse(req.body);
            await this.service.resetPassword(validated);
            res.status(200).json({
                status: 'success',
                message: 'Password has been reset successfully. Please log in with your new credentials.',
            });
        }
        catch (error) {
            next(error);
        }
    };
    switchWorkspace = async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ status: 'error', message: 'Unauthorized' });
                return;
            }
            const { targetRole } = req.body;
            if (!targetRole) {
                res.status(400).json({ status: 'error', message: 'targetRole parameter is required' });
                return;
            }
            const result = await this.service.switchWorkspace(req.user.id, targetRole);
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
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map