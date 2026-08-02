"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const prisma_1 = require("../../lib/prisma");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class DashboardController {
    getStats = async (req, res, next) => {
        try {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            // 1. Database actuals
            const totalUsers = await prisma_1.prisma.user.count();
            const totalActiveUsers = await prisma_1.prisma.user.count({ where: { status: 'ACTIVE' } });
            const totalDepts = await prisma_1.prisma.department.count({ where: { deleted: false } });
            const totalCourses = await prisma_1.prisma.course.count({ where: { deleted: false } });
            const totalSubjects = await prisma_1.prisma.subject.count({ where: { deleted: false } });
            const onlineSessions = await prisma_1.prisma.userSession.count();
            const studentCount = await prisma_1.prisma.student.count({ where: { deleted: false } });
            const facultyCount = await prisma_1.prisma.faculty.count({ where: { deleted: false } });
            const parentRole = await prisma_1.prisma.role.findFirst({ where: { name: 'Parent' } });
            const parentCount = parentRole ? await prisma_1.prisma.user.count({ where: { roleId: parentRole.id } }) : 0;
            const mentorRole = await prisma_1.prisma.role.findFirst({ where: { name: 'Mentor' } });
            const mentorCount = mentorRole ? await prisma_1.prisma.user.count({ where: { roleId: mentorRole.id } }) : 0;
            const latestBackup = await prisma_1.prisma.backupLog.findFirst({
                where: { status: 'SUCCESS' },
                orderBy: { createdAt: 'desc' },
            });
            const latestBackupTime = latestBackup ? latestBackup.createdAt.toLocaleString() : 'Never';
            const failedLoginAttempts = await prisma_1.prisma.loginHistory.count({
                where: { status: 'FAILED' },
            });
            // Attendance calculations
            const totalAttendanceRecordsToday = await prisma_1.prisma.attendance.count({
                where: { date: { gte: startOfDay } }
            });
            const presentToday = await prisma_1.prisma.attendance.count({
                where: { date: { gte: startOfDay }, status: 'PRESENT' }
            });
            const attendanceTodayPercentage = totalAttendanceRecordsToday > 0
                ? `${((presentToday / totalAttendanceRecordsToday) * 100).toFixed(1)}%`
                : '0.0%';
            // Fees calculations
            const feeBillsPaidThisMonth = await prisma_1.prisma.feeBill.aggregate({
                _sum: { paidAmount: true },
                where: { status: 'PAID', updatedAt: { gte: startOfMonth } }
            });
            const feeCollectionThisMonth = feeBillsPaidThisMonth._sum?.paidAmount || 0;
            const pendingFeesAgg = await prisma_1.prisma.feeBill.aggregate({
                _sum: { amount: true },
                where: { status: { in: ['PENDING', 'PARTIAL'] } }
            });
            const pendingFees = pendingFeesAgg._sum?.amount || 0;
            // Pending Leaves & Complaints
            const pendingLeaves = await prisma_1.prisma.workflowRequest.count({ where: { status: 'PENDING' } });
            const pendingComplaints = await prisma_1.prisma.ticket.count({ where: { status: 'OPEN' } });
            // Placements & Exams & Library
            const placementsCount = await prisma_1.prisma.placementRecord.count();
            const libraryBooksCount = await prisma_1.prisma.libraryBook.count();
            const upcomingExamsCount = await prisma_1.prisma.exam.count({ where: { startDate: { gte: now } } });
            const transportVehiclesCount = await prisma_1.prisma.transportRoute.count();
            // Uptime calculations
            const uptimeSec = process.uptime();
            const uptimeDays = Math.floor(uptimeSec / (3600 * 24));
            const uptimeHrs = Math.floor((uptimeSec % (3600 * 24)) / 3600);
            const uptimeMin = Math.floor((uptimeSec % 3600) / 60);
            const uptimeString = uptimeDays > 0
                ? `${uptimeDays}d, ${uptimeHrs}h`
                : `${uptimeHrs}h, ${uptimeMin}m`;
            // Storage calculation
            let dbSize = 0;
            try {
                const dbPath = path_1.default.join(__dirname, '../../../prisma/dev.db');
                if (fs_1.default.existsSync(dbPath)) {
                    dbSize = fs_1.default.statSync(dbPath).size;
                }
            }
            catch (err) {
                // ignore
            }
            const memoryUsage = process.memoryUsage().heapUsed;
            // Query settings for branding metadata
            const dbSettings = await prisma_1.prisma.systemSetting.findMany();
            const settings = {};
            dbSettings.forEach((item) => {
                settings[item.key] = item.value;
            });
            res.status(200).json({
                status: 'success',
                data: {
                    metrics: {
                        collegeName: settings.COLLEGE_NAME || 'Geetorus Institute of Technology',
                        collegeAddress: settings.COLLEGE_ADDRESS || '123 Education Boulevard, Campus City, 600001',
                        collegePhone: settings.COLLEGE_PHONE || '+91 98765 43210',
                        collegeWebsite: settings.COLLEGE_WEBSITE || 'https://geetorus.com',
                        brandColor: settings.BRAND_COLOR || '#4f46e5',
                        // Real dynamic database metrics
                        totalStudents: studentCount,
                        totalFaculty: facultyCount,
                        totalMentors: mentorCount,
                        totalParents: parentCount,
                        totalDepartments: totalDepts,
                        totalCourses: totalCourses,
                        totalSubjects: totalSubjects,
                        totalActiveUsers,
                        // Attendance
                        todayAttendance: attendanceTodayPercentage,
                        attendanceToday: presentToday,
                        // Fees
                        feeCollectionThisMonth,
                        pendingFees,
                        // Placements, Workflows, Support
                        placementsCount,
                        pendingLeaves,
                        pendingComplaints,
                        // Library & Infrastructure
                        libraryBooks: libraryBooksCount,
                        booksIssued: 0,
                        upcomingExams: upcomingExamsCount,
                        transportVehicles: transportVehiclesCount,
                        // Security & System
                        onlineUsers: onlineSessions,
                        systemUptime: uptimeString,
                        databaseStatus: 'CONNECTED',
                        serverStatus: 'HEALTHY',
                        storageUsage: `${(dbSize / (1024 * 1024)).toFixed(2)} MB`,
                        memoryUsage: `${(memoryUsage / (1024 * 1024)).toFixed(1)} MB`,
                        appVersion: 'v1.0.0-phase3.1',
                        latestBackupTime,
                        failedLoginAttempts,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
    getCharts = async (req, res, next) => {
        try {
            // 1. Fetch real department overview from DB
            const departments = await prisma_1.prisma.department.findMany({
                where: { deleted: false },
                include: {
                    students: { where: { deleted: false } },
                    faculties: { where: { deleted: false } },
                },
            });
            const departmentOverview = departments.map((dept) => ({
                name: `${dept.name} (${dept.code})`,
                students: dept.students.length,
                faculty: dept.faculties.length,
                attendance: '0.0%',
                pass: '0.0%',
                placement: '0.0%',
            }));
            // 2. Fetch real recent user activity logs
            const logs = await prisma_1.prisma.userActivityLog.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { user: true },
            });
            const recentActivity = logs.map((log) => ({
                id: log.id,
                action: log.action,
                desc: `${log.user ? `${log.user.firstName} ${log.user.lastName}: ` : ''}${log.description}`,
                time: log.createdAt.toLocaleTimeString(),
            }));
            res.status(200).json({
                status: 'success',
                data: {
                    departmentOverview,
                    recentActivity,
                    admissionsTrend: [],
                    studentGrowth: [],
                    facultyGrowth: [],
                    departmentDistribution: departments.map(d => ({ name: d.name, count: d.students.length })),
                    attendanceTrend: [],
                    feeCollectionTrend: [],
                    examPerformance: [],
                    revenueTrend: [],
                    genderDistribution: [],
                    categoryDistribution: [],
                    courseDistribution: [],
                    academicPerformance: [],
                    todaysClasses: [],
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=dashboard.controller.js.map