"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requirePermission = exports.checkPermission = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const exceptions_1 = require("../../utils/exceptions");
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new exceptions_1.UnauthorizedException('Access token missing or invalid');
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        throw new exceptions_1.UnauthorizedException('Access token expired or corrupted');
    }
};
exports.requireAuth = requireAuth;
const checkPermission = (userPermissions, required) => {
    if (userPermissions.includes('*:*') || userPermissions.includes('*'))
        return true;
    if (userPermissions.includes(required))
        return true;
    const parts = required.split(':');
    if (parts.length !== 2)
        return false;
    const [reqModule, reqAction] = parts;
    // Module level wildcard or management permission bypass
    if (userPermissions.includes(`${reqModule}:*`) || userPermissions.includes(`${reqModule}:manage`)) {
        return true;
    }
    // Mapping compatibility
    if (reqAction === 'read') {
        return userPermissions.includes(`${reqModule}:view`) || userPermissions.includes(`${reqModule}:read`);
    }
    if (reqAction === 'write') {
        return userPermissions.includes(`${reqModule}:create`) ||
            userPermissions.includes(`${reqModule}:edit`) ||
            userPermissions.includes(`${reqModule}:delete`) ||
            userPermissions.includes(`${reqModule}:write`);
    }
    return false;
};
exports.checkPermission = checkPermission;
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new exceptions_1.UnauthorizedException('Authentication required');
        }
        // Super Admin gets all privileges
        if (req.user.role === 'Super Admin') {
            return next();
        }
        const hasPermission = (0, exports.checkPermission)(req.user.permissions, permission);
        if (!hasPermission) {
            throw new exceptions_1.ForbiddenException(`You do not have the required permission: ${permission}`);
        }
        next();
    };
};
exports.requirePermission = requirePermission;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new exceptions_1.UnauthorizedException('Authentication required');
        }
        // Super Admin has bypass access
        if (req.user.role === 'Super Admin') {
            return next();
        }
        const hasRole = allowedRoles.includes(req.user.role);
        if (!hasRole) {
            throw new exceptions_1.ForbiddenException('Your role does not allow access to this resource');
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.middleware.js.map