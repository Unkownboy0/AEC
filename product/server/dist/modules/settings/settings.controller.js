"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const prisma_1 = require("../../lib/prisma");
const exceptions_1 = require("../../utils/exceptions");
class SettingsController {
    /**
     * List all settings key-value pairs
     */
    list = async (req, res, next) => {
        try {
            const dbSettings = await prisma_1.prisma.systemSetting.findMany();
            // Convert list to a key-value dictionary object
            const settings = {};
            dbSettings.forEach((item) => {
                settings[item.key] = item.value;
            });
            res.status(200).json({
                status: 'success',
                data: settings,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Bulk update key-value pairs
     */
    update = async (req, res, next) => {
        try {
            const body = req.body;
            if (typeof body !== 'object' || body === null) {
                throw new exceptions_1.BadRequestException('Request body must be a JSON object of settings');
            }
            const keys = Object.keys(body);
            const updatedList = [];
            for (const key of keys) {
                const val = String(body[key]);
                const setting = await prisma_1.prisma.systemSetting.upsert({
                    where: { key },
                    update: { value: val },
                    create: { key, value: val },
                });
                updatedList.push(setting);
            }
            // Write audit log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
                    action: 'UPDATE',
                    module: 'SETTING',
                    description: `Updated system configuration keys: ${keys.join(', ')}`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                },
            });
            // Format response dictionary
            const settingsDict = {};
            updatedList.forEach((s) => {
                settingsDict[s.key] = s.value;
            });
            res.status(200).json({
                status: 'success',
                data: settingsDict,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get Principal Availability Status (ONLINE / OFFLINE)
     */
    getPrincipalAvailability = async (req, res, next) => {
        try {
            const setting = await prisma_1.prisma.systemSetting.findUnique({
                where: { key: 'PRINCIPAL_OFFLINE_MODE' },
            });
            const isOffline = setting?.value === 'true';
            res.status(200).json({
                status: 'success',
                data: { isOffline, status: isOffline ? 'OFFLINE' : 'ONLINE' },
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Set Principal Availability Status (ONLINE / OFFLINE)
     */
    setPrincipalAvailability = async (req, res, next) => {
        try {
            const { isOffline } = req.body;
            const val = isOffline ? 'true' : 'false';
            await prisma_1.prisma.systemSetting.upsert({
                where: { key: 'PRINCIPAL_OFFLINE_MODE' },
                update: { value: val },
                create: { key: 'PRINCIPAL_OFFLINE_MODE', value: val },
            });
            // Write Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user?.id || 'SYSTEM',
                    action: 'UPDATE',
                    module: 'SETTING',
                    description: `Principal availability changed to ${isOffline ? 'OFFLINE' : 'ONLINE'}. Approval delegation to Vice Principal ${isOffline ? 'ACTIVATED' : 'DEACTIVATED'}.`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                },
            });
            res.status(200).json({
                status: 'success',
                data: { isOffline, status: isOffline ? 'OFFLINE' : 'ONLINE' },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.SettingsController = SettingsController;
//# sourceMappingURL=settings.controller.js.map