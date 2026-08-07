"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requirePermission = exports.checkPermission = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const exceptions_1 = require("../../utils/exceptions");
const prisma_1 = require("../../lib/prisma");
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new exceptions_1.UnauthorizedException('Access token missing or invalid'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const userPayload = { ...decoded };
        const activeRole = req.headers['x-active-role'];
        if (activeRole && activeRole !== decoded.role) {
            const allowedRoles = [decoded.role];
            if (['Faculty', 'HOD', 'Academic Dean', 'Vice Principal', 'Principal'].includes(decoded.role)) {
                allowedRoles.push('Faculty', 'Mentor');
            }
            if (allowedRoles.includes(activeRole)) {
                const roleData = await prisma_1.prisma.role.findFirst({
                    where: { name: activeRole },
                    include: { permissions: { include: { permission: true } } }
                });
                if (roleData) {
                    userPayload.role = activeRole;
                    userPayload.permissions = roleData.permissions.map(p => p.permission.name);
                }
            }
        }
        req.user = userPayload;
        next();
    }
    catch (error) {
        next(new exceptions_1.UnauthorizedException('Access token expired or corrupted'));
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
        // Super Admin & Principal get executive privilege access
        const userRoleNorm = normalizeRoleStr(typeof req.user.role === 'object' ? req.user.role?.name : String(req.user.role || ''));
        if (userRoleNorm === 'SUPERADMIN' || userRoleNorm === 'ADMIN' || userRoleNorm === 'PRINCIPAL') {
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
const normalizeRoleStr = (r) => (r || '').toUpperCase().replace(/[\s_]+/g, '');
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return next(new exceptions_1.UnauthorizedException('Authentication required'));
        }
        const userRoleRaw = typeof req.user.role === 'object' ? req.user.role?.name : String(req.user.role || '');
        const userRoleNorm = normalizeRoleStr(userRoleRaw);
        // 1. Super Admin and Principal have top-level executive access to all college ERP resources
        if (userRoleNorm === 'SUPERADMIN' || userRoleNorm === 'ADMIN' || userRoleNorm === 'PRINCIPAL') {
            return next();
        }
        const normalizedAllowed = allowedRoles.map(normalizeRoleStr);
        // 2. Direct normalized match
        let hasRole = normalizedAllowed.includes(userRoleNorm);
        // 3. Role alias & hierarchy matching
        if (!hasRole) {
            if ((userRoleNorm === 'VICEPRINCIPAL' || userRoleNorm === 'VP') && normalizedAllowed.some(r => r === 'VP' || r === 'VICEPRINCIPAL' || r === 'PRINCIPAL')) {
                hasRole = true;
            }
            else if (userRoleNorm.includes('DEAN') && normalizedAllowed.some(r => r.includes('DEAN'))) {
                hasRole = true;
            }
            else if (userRoleNorm === 'HOD' && normalizedAllowed.some(r => r === 'HOD' || r === 'HEADOFDEPARTMENT')) {
                hasRole = true;
            }
            else if (userRoleNorm === 'FACULTY' && normalizedAllowed.some(r => r === 'FACULTY' || r === 'TEACHER')) {
                hasRole = true;
            }
        }
        // 4. Active Principal delegation check for VP
        if (!hasRole && (userRoleNorm === 'VICEPRINCIPAL' || userRoleNorm === 'VP')) {
            try {
                const activeDelegation = await prisma_1.prisma.principalDelegation.findFirst({
                    where: {
                        actingUserId: req.user.id,
                        status: 'ACTIVE',
                        endDate: { gte: new Date() }
                    }
                });
                if (activeDelegation) {
                    hasRole = true;
                }
            }
            catch {
                // Fallback
            }
        }
        if (!hasRole) {
            return next(new exceptions_1.ForbiddenException('Your role does not allow access to this resource'));
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.middleware.js.map