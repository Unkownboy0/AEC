"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const prisma_1 = require("../../lib/prisma");
const exceptions_1 = require("../../utils/exceptions");
const logger_1 = require("../../utils/logger");
class NotificationsController {
    /**
     * List all notification logs
     */
    list = async (req, res, next) => {
        try {
            const logs = await prisma_1.prisma.systemNotification.findMany({
                orderBy: { createdAt: 'desc' },
            });
            res.status(200).json({
                status: 'success',
                data: logs,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Create and send/schedule a notification
     */
    create = async (req, res, next) => {
        try {
            const { title, content, type, scheduledFor, imageUrl } = req.body;
            if (!title || !content || !type) {
                throw new exceptions_1.BadRequestException('title, content and type are required');
            }
            const scheduleDate = scheduledFor ? new Date(scheduledFor) : null;
            const status = scheduleDate ? 'PENDING' : 'SENT';
            const notification = await prisma_1.prisma.systemNotification.create({
                data: {
                    title,
                    content,
                    type,
                    status,
                    scheduledFor: scheduleDate,
                    imageUrl,
                },
            });
            if (status === 'SENT') {
                logger_1.logger.info(`[NOTIFICATION DISPATCHED] Type: ${type} | Title: ${title} | Content: ${content} | Image: ${imageUrl || 'None'}`);
            }
            else {
                logger_1.logger.info(`[NOTIFICATION SCHEDULED] Type: ${type} | For: ${scheduleDate}`);
            }
            // Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
                    action: 'CREATE',
                    module: 'NOTIFICATION',
                    description: `Dispatched notification campaign: ${title} (${type})${imageUrl ? ' with attachment' : ''}`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                },
            });
            res.status(201).json({
                status: 'success',
                data: notification,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Delete log
     */
    delete = async (req, res, next) => {
        try {
            await prisma_1.prisma.systemNotification.delete({
                where: { id: req.params.id },
            });
            res.status(200).json({
                status: 'success',
                message: 'Notification log cleared',
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.NotificationsController = NotificationsController;
//# sourceMappingURL=notifications.controller.js.map