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
const workspace_access_1 = require("../../modules/auth/workspace-access");
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new exceptions_1.UnauthorizedException('Access token missing or invalid'));
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET, {
            maxAge: env_1.env.JWT_EXPIRES_IN,
        });
    }
    catch {
        return next(new exceptions_1.UnauthorizedException('Access token expired or corrupted'));
    }
    try {
        const access = await (0, workspace_access_1.resolveUserWorkspaceAccess)(decoded.id);
        if (!access) {
            return next(new exceptions_1.UnauthorizedException('User account is inactive or no longer available'));
        }
        const requestedRoleHeader = req.headers['x-active-role'];
        const requestedRole = typeof requestedRoleHeader === 'string' && requestedRoleHeader.trim()
            ? requestedRoleHeader.trim()
            : decoded.role;
        const workspace = access.workspaces.find((entry) => entry.name === requestedRole);
        if (!workspace) {
            return next(new exceptions_1.ForbiddenException('The requested workspace is not assigned to your account'));
        }
        req.user = {
            id: access.userId,
            email: access.email,
            role: workspace.name,
            permissions: workspace.permissions,
        };
        return next();
    }
    catch (error) {
        return next(error);
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
        const normalizedAllowed = allowedRoles.map(normalizeRoleStr);
        // Direct active-workspace role match. Elevated roles must still be listed
        // explicitly by the route; authentication alone is never an authorization bypass.
        let hasRole = normalizedAllowed.includes(userRoleNorm);
        // 3. Narrow aliases only. Dean workspaces are intentionally not aliases for
        // one another, and VP is not Principal without an active delegation.
        if (!hasRole) {
            if ((userRoleNorm === 'VICEPRINCIPAL' || userRoleNorm === 'VP') && normalizedAllowed.some(r => r === 'VP' || r === 'VICEPRINCIPAL')) {
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
        const routeAcceptsDelegatedPrincipal = normalizedAllowed.some((role) => role === 'PRINCIPAL' || role === 'ACTINGPRINCIPAL');
        if (!hasRole && routeAcceptsDelegatedPrincipal && (userRoleNorm === 'VICEPRINCIPAL' || userRoleNorm === 'VP')) {
            try {
                const activeDelegation = await prisma_1.prisma.principalDelegation.findFirst({
                    where: {
                        actingUserId: req.user.id,
                        status: 'ACTIVE',
                        startDate: { lte: new Date() },
                        endDate: { gt: new Date() }
                    }
                });
                let delegatedScope = {};
                try {
                    delegatedScope = activeDelegation ? JSON.parse(activeDelegation.delegatedScope || '{}') : {};
                }
                catch {
                    delegatedScope = {};
                }
                if (activeDelegation && delegatedScope.tenantId === env_1.env.CAMPUS_TENANT_ID) {
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