"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const prisma_1 = require("../../lib/prisma");
const leavePolicy_1 = require("../../utils/leavePolicy");
const settings_service_1 = require("./settings.service");
class SettingsController {
    service = new settings_service_1.SettingsService();
    catalog = async (_req, res, next) => {
        try {
            res.status(200).json({ status: 'success', data: await this.service.catalog() });
        }
        catch (error) {
            next(error);
        }
    };
    preview = async (req, res, next) => {
        try {
            res.status(200).json({ status: 'success', data: this.service.preview(req.body?.changes) });
        }
        catch (error) {
            next(error);
        }
    };
    getRequestPolicy = async (_req, res, next) => {
        try {
            res.status(200).json({
                status: 'success',
                data: { odMinAdvanceDays: await (0, leavePolicy_1.getOdMinAdvanceDays)(), leaveMinAdvanceDays: 0 },
            });
        }
        catch (error) {
            next(error);
        }
    };
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
            const result = await this.service.update(req.body?.changes ?? req.body, req.user, { ip: req.ip, userAgent: req.headers['user-agent'] });
            res.status(200).json({ status: 'success', data: result });
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