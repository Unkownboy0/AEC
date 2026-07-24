"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const roles_routes_1 = __importDefault(require("./modules/roles/roles.routes"));
const settings_routes_1 = __importDefault(require("./modules/settings/settings.routes"));
const academics_routes_1 = __importDefault(require("./modules/academics/academics.routes"));
const masters_routes_1 = __importDefault(require("./modules/masters/masters.routes"));
const security_routes_1 = __importDefault(require("./modules/security/security.routes"));
const backup_routes_1 = __importDefault(require("./modules/backup/backup.routes"));
const files_routes_1 = __importDefault(require("./modules/files/files.routes"));
const notifications_routes_1 = __importDefault(require("./modules/notifications/notifications.routes"));
const reports_routes_1 = __importDefault(require("./modules/reports/reports.routes"));
const enterprise_routes_1 = __importDefault(require("./modules/enterprise/enterprise.routes"));
const workflow_routes_1 = __importDefault(require("./modules/workflow/workflow.routes"));
const timetable_routes_1 = __importDefault(require("./modules/timetable/timetable.routes"));
const ai_routes_1 = __importDefault(require("./modules/ai/ai.routes"));
const assignments_routes_1 = __importDefault(require("./modules/enterprise/assignments.routes"));
const chat_routes_1 = __importDefault(require("./modules/chat/chat.routes"));
const circular_routes_1 = __importDefault(require("./modules/enterprise/circular.routes"));
const error_middleware_1 = require("./core/middlewares/error.middleware");
const logger_1 = require("./utils/logger");
const env_1 = require("./config/env");
const app = (0, express_1.default)();
// Security HTTP headers
app.use((0, helmet_1.default)());
// Serve uploaded files statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Enable CORS
const allowedOrigins = env_1.env.ALLOWED_ORIGINS.split(',');
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || env_1.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
// Body parser (increase limit for base64 file uploads)
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging middleware
app.use((req, res, next) => {
    logger_1.logger.http(`${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});
const rateLimit_middleware_1 = require("./core/middlewares/rateLimit.middleware");
const sanitize_middleware_1 = require("./core/middlewares/sanitize.middleware");
// Global input sanitization
app.use(sanitize_middleware_1.sanitizeInput);
// Global API rate limiting
app.use('/api', rateLimit_middleware_1.apiRateLimiter);
// Mount Routes
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        timestamp: new Date().toISOString(),
        environment: env_1.env.NODE_ENV,
        uptime: process.uptime(),
    });
});
app.use('/api/auth', rateLimit_middleware_1.authRateLimiter, auth_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/roles', roles_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/academics', academics_routes_1.default);
app.use('/api/masters', masters_routes_1.default);
app.use('/api/security', security_routes_1.default);
app.use('/api/backups', backup_routes_1.default);
app.use('/api/files', files_routes_1.default);
app.use('/api/notifications', notifications_routes_1.default);
app.use('/api/reports', reports_routes_1.default);
app.use('/api/enterprise', enterprise_routes_1.default);
app.use('/api/workflows', workflow_routes_1.default);
app.use('/api/timetables', timetable_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use('/api/assignments', assignments_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/circulars', circular_routes_1.default);
// Fallback Route
app.use('*', (req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: `Cannot ${req.method} ${req.baseUrl}`,
    });
});
// Centralized error boundary
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map