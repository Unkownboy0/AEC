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
}
exports.SettingsController = SettingsController;
//# sourceMappingURL=settings.controller.js.map