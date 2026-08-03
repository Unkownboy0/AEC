import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
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
import notificationsRoutes from './modules/notifications/notifications.routes';
import reportsRoutes from './modules/reports/reports.routes';
import enterpriseRoutes from './modules/enterprise/enterprise.routes';
import workflowRoutes from './modules/workflow/workflow.routes';
import timetableRoutes from './modules/timetable/timetable.routes';
import aiRoutes from './modules/ai/ai.routes';
import assignmentsRoutes from './modules/enterprise/assignments.routes';
import chatRoutes from './modules/chat/chat.routes';
import circularRoutes from './modules/enterprise/circular.routes';
import curriculumRoutes from './modules/curriculum/curriculum.routes';
import sportsRoutes from './modules/sports/sports.routes';
import taskRoutes from './modules/enterprise/task.routes';


import { errorHandler } from './core/middlewares/error.middleware';
import { logger } from './utils/logger';
import { env } from './config/env';

const app = express();

// Security HTTP headers
app.use(helmet());

// Serve uploaded files statically with security headers
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'");
    },
  })
);

// Enable CORS
const allowedOrigins = env.ALLOWED_ORIGINS.split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
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

import { authRateLimiter, apiRateLimiter } from './core/middlewares/rateLimit.middleware';
import { sanitizeInput } from './core/middlewares/sanitize.middleware';

// Global input sanitization
app.use(sanitizeInput);

// Global API rate limiting
app.use('/api', apiRateLimiter);

// Mount Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: process.uptime(),
  });
});

import rbacRoutes from './modules/enterprise/rbac.routes';
import iamRoutes from './modules/enterprise/iam.routes';

app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/iam', iamRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/academics', academicsRoutes);
app.use('/api/masters', mastersRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/backups', backupsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/circulars', circularRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/sports', sportsRoutes);
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

app.use('/api/enterprise/student-leave', studentLeaveRoutes);
app.use('/api/student/leave-od', studentLeaveRoutes);
app.use('/api/mentor/leave-od', studentLeaveRoutes);
app.use('/api/hod', hodPortalRoutes);
app.use('/api/enterprise/faculty-leave', facultyLeaveRoutes);
app.use('/api/enterprise/principal-failover', principalFailoverRoutes);
app.use('/api/enterprise/circulars', circularEngineRoutes);
app.use('/api/enterprise/profile', profileDrilldownRoutes);
app.use('/api/enterprise/timeline', timelineRoutes);
app.use('/api/enterprise/analytics', analyticsRoutes);
app.use('/api/enterprise', phase8ExportRoutes);
app.use('/api', phase10ProductionRoutes);
app.use('/api/tasks', taskRoutes);

app.use('/api/academic-dean', academicDeanRoutes);
app.use('/api/admission-dean', admissionDeanRoutes);



// Fallback Route
app.use('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.baseUrl}`,
  });
});

// Centralized error boundary
app.use(errorHandler);

export default app;
