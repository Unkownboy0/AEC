import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';

// Core Middlewares, Utils & Config
import { errorHandler } from './core/middlewares/error.middleware';
import { logger } from './utils/logger';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { authRateLimiter, apiRateLimiter } from './core/middlewares/rateLimit.middleware';
import { sanitizeInput } from './core/middlewares/sanitize.middleware';
import { requestIdMiddleware } from './core/middlewares/requestId.middleware';

// Core Module Routes
import authRoutes from './modules/auth/auth.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import usersRoutes from './modules/users/users.routes';
import rolesRoutes from './modules/roles/roles.routes';
import settingsRoutes from './modules/settings/settings.routes';
import academicsRoutes from './modules/academics/academics.routes';
import mastersRoutes from './modules/masters/masters.routes';
import securityRoutes from './modules/security/security.routes';
import backupsRoutes from './modules/backup/backup.routes';
import filesRoutes from './modules/files/files.routes';
import notificationsRoutes from './modules/notifications/notification.routes';
import notificationAdminRoutes from './modules/notifications/notifications.routes';
import reportsRoutes from './modules/reports/reports.routes';
import enterpriseRoutes from './modules/enterprise/enterprise.routes';
import managementRoutes from './modules/management/management.routes';
import principalCommandRoutes from './modules/principal-command/principal-command.routes';
import vpCommandRoutes from './modules/vp-command/vp-command.routes';
import workflowRoutes from './modules/workflow/workflow.routes';
import timetableRoutes from './modules/timetable/timetable.routes';
import aiRoutes from './modules/ai/ai.routes';
import assignmentsRoutes from './modules/enterprise/assignments.routes';
import chatRoutes from './modules/chat/chat.routes';
import circularRoutes from './modules/enterprise/circular.routes';
import curriculumRoutes from './modules/curriculum/curriculum.routes';
import sportsRoutes from './modules/sports/sports.routes';
import taskRoutes from './modules/enterprise/task.routes';
import iqacRoutes from './modules/iqac/iqac.routes';
import financeRoutes from './modules/finance/finance.routes';
import coeRoutes from './modules/coe/coe.routes';
import rbacRoutes from './modules/enterprise/rbac.routes';
import iamRoutes from './modules/enterprise/iam.routes';
import studentLeaveRoutes from './modules/enterprise/student-leave.routes';
import hodPortalRoutes from './modules/hod/hod.routes';
import facultyLeaveRoutes from './modules/enterprise/faculty-leave.routes';
import principalFailoverRoutes from './modules/enterprise/principal-failover.routes';
import circularEngineRoutes from './modules/enterprise/circular-engine.routes';
import profileDrilldownRoutes from './modules/enterprise/profile-drilldown.routes';
import timelineRoutes from './modules/enterprise/timeline.routes';
import phase8ExportRoutes from './modules/enterprise/phase8-export.routes';
import analyticsRoutes from './modules/enterprise/analytics.routes';
import phase10ProductionRoutes from './modules/enterprise/phase10-production.routes';
import academicDeanRoutes from './modules/enterprise/academic-dean.routes';
import academicDeanHodRoutes from './modules/enterprise/academic-dean-hod.routes';
import admissionDeanRoutes from './modules/enterprise/admission-dean.routes';
import administrationDeanRoutes from './modules/administration-dean/administration-dean.routes';
import parentRoutes from './modules/parent/parent.routes';
import facultyRoutes from './modules/faculty/faculty.routes';
import mentorRoutes from './modules/mentor/mentor.routes';
import delegationRoutes from './modules/principal-delegation/delegation.routes';
import principalAvailabilityRouter from './modules/principal-availability/availability.routes';
import customFacultyLeaveRoutes from './modules/faculty-leave/faculty-leave.routes';
import hodTaskRoutes from './modules/hod-tasks/hod-task.routes';
import campusOfficeRoutes from './modules/enterprise/campus-office.routes';
import hodTimetableRoutes from './modules/timetable/hod-timetable.routes';
import workspaceRoutes from './modules/campus-workspace/workspace.routes';

// Jobs & Services
import { PrincipalDataRepairScript } from './modules/principal-availability/repair-principal-availability';
import { DelegationExpiryJob } from './modules/principal-availability/delegation-expiry.job';

// CampusOS Modules 09–51
import libraryRoutes from './modules/library/library.routes';
import hostelRoutes from './modules/hostel/hostel.routes';
import transportRoutes from './modules/transport/transport.routes';
import campusSecurityRoutes from './modules/campus-security/campus-security.routes';
import appraisalRoutes from './modules/appraisal/appraisal.routes';
import evidenceRoutes from './modules/evidence/evidence.routes';
import studentServicesRoutes from './modules/student-services/student-services.routes';
import purchaseRoutes from './modules/purchase/purchase.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import vendorRoutes from './modules/vendor/vendor.routes';
import maintenanceRoutes from './modules/maintenance/maintenance.routes';
import roomBookingRoutes from './modules/room-booking/room-booking.routes';
import meetingRoutes from './modules/meeting/meeting.routes';
import researchRoutes from './modules/research/research.routes';
import scholarshipRoutes from './modules/scholarship/scholarship.routes';
import clubsRoutes from './modules/clubs/clubs.routes';
import alumniRoutes from './modules/alumni/alumni.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import emergencyRoutes from './modules/emergency/emergency.routes';
import activityRoutes from './modules/activity/activity.routes';
import student360Routes from './modules/student-360/student-360.routes';
import staff360Routes from './modules/staff-360/staff-360.routes';
import integrationRoutes from './modules/integration/integration-chain.routes';

const app = express();

app.set('trust proxy', env.TRUST_PROXY);

// Security HTTP headers
app.use(helmet());

// Preserve legacy upload URLs during local development while the client is
// migrated to authenticated file IDs. Production remains fail-closed and only
// serves files through the permission-checked files API.
if (env.NODE_ENV !== 'production') {
  app.use(
    '/uploads',
    express.static(env.STORAGE_ROOT, {
      fallthrough: false,
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
        res.setHeader('Cache-Control', 'private, max-age=300');
      },
    })
  );
}

// Enable CORS
const allowedOrigins = [
  ...env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://10.0.2.2:5000',
  'http://10.226.116.201:5000',
  'http://10.226.116.201:5173',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, native webviews)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || env.NODE_ENV === 'development' || origin.startsWith('capacitor://') || origin.startsWith('https://localhost') || origin.startsWith('http://localhost')) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

// Body parser (increase limit for base64 file uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Assign X-Request-ID to every request (must be very early in the pipeline)
app.use(requestIdMiddleware);

// Global input sanitization
app.use(sanitizeInput);

// Global API rate limiting
app.use('/api', apiRateLimiter);

// Health Check
app.get('/api/health', async (req, res) => {
  let dbStatus: 'ok' | 'error' = 'ok';
  let dbLatencyMs: number | null = null;
  try {
    const start = Date.now();
    await (prisma as any).$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
  } catch {
    dbStatus = 'error';
  }

  const overall = dbStatus === 'ok' ? 'healthy' : 'degraded';

  res.status(dbStatus === 'ok' ? 200 : 503).json({
    status: overall,
    version: '1.0.0',
    environment: env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId,
    checks: {
      database: { status: dbStatus, latencyMs: dbLatencyMs },
      storage: { status: 'ok' },
    },
  });
});

// Core API Routes
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/me', authRoutes);
app.use('/api/v1/me', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/iam', iamRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/academics', academicsRoutes);
app.use('/api/masters', mastersRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/backups', backupsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/v1/files', filesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin/notification-campaigns', notificationAdminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/principal-command', principalCommandRoutes);
app.use('/api/vp-command', vpCommandRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/v1/student/timetable', timetableRoutes);
app.use('/api/student/timetable', timetableRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/circulars', circularRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/coe', coeRoutes);

app.use('/api/enterprise/student-leave', studentLeaveRoutes);
app.use('/api/student/leave-od', studentLeaveRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/hod', academicDeanHodRoutes);
app.use('/api/hod', hodPortalRoutes);
app.use('/api/enterprise/faculty-leave', facultyLeaveRoutes);
app.use('/api/faculty/leave', facultyLeaveRoutes);
app.use('/api/faculty-leave', facultyLeaveRoutes);
app.use('/api/enterprise/principal-failover', principalFailoverRoutes);
app.use('/api/enterprise/circulars', circularEngineRoutes);
app.use('/api/enterprise/profile', profileDrilldownRoutes);
app.use('/api/enterprise/timeline', timelineRoutes);
app.use('/api/enterprise/analytics', analyticsRoutes);
app.use('/api/enterprise', phase8ExportRoutes);
app.use('/api', phase10ProductionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/iqac', iqacRoutes);

app.use('/api', customFacultyLeaveRoutes);
app.use('/api', hodTaskRoutes);
app.use('/api/campus-office', campusOfficeRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/hod-timetable', hodTimetableRoutes);
app.use('/api/hod/timetable-mgmt', hodTimetableRoutes);

app.use('/api/academic-dean', academicDeanRoutes);
app.use('/api/admission-dean', admissionDeanRoutes);
app.use('/api/administration-dean', administrationDeanRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api', principalAvailabilityRouter);
app.use('/api', delegationRoutes);

// Modules 09–51
app.use('/api/library', libraryRoutes);
app.use('/api/hostel', hostelRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/campus-security', campusSecurityRoutes);
app.use('/api/appraisal', appraisalRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/student-services', studentServicesRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/room-booking', roomBookingRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/student-360', student360Routes);
app.use('/api/staff-360', staff360Routes);
app.use('/api/integration', integrationRoutes);

// Background Jobs & Cleanups
PrincipalDataRepairScript.runCleanup()
  .then(res => logger.info(`⚡ Principal Availability Cleanup completed: ${res.revokedInvalidDelegations} revoked, ${res.expiredDelegations} expired`))
  .catch(err => logger.warn('Principal Availability cleanup failed:', err));

DelegationExpiryJob.startCron();

// Fallback Route for API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.baseUrl}`,
  });
});

// SPA Fallback for Web App Production
const clientBuildPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(path.join(clientBuildPath, 'index.html'))) {
  app.use(express.static(clientBuildPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
  logger.info('✅ SPA static fallback enabled');
} else {
  logger.info('ℹ️  SPA fallback skipped (client/dist not found — dev mode)');
}

// Centralized error boundary
app.use(errorHandler);

export default app;
