"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
class ReportsController {
    getAdmissions = async (req, res, next) => {
        try {
            res.status(200).json({
                status: 'success',
                data: [
                    { year: '2022', cse: 120, ece: 100, mech: 80, civil: 20 },
                    { year: '2023', cse: 140, ece: 110, mech: 75, civil: 25 },
                    { year: '2024', cse: 165, ece: 95, mech: 85, civil: 30 },
                    { year: '2025', cse: 190, ece: 105, mech: 90, civil: 40 },
                    { year: '2026', cse: 220, ece: 120, mech: 95, civil: 45 },
                ],
            });
        }
        catch (error) {
            next(error);
        }
    };
    getRevenue = async (req, res, next) => {
        try {
            res.status(200).json({
                status: 'success',
                data: [
                    { term: 'Fall 2024', collected: 245000, pending: 15000, discount: 5000 },
                    { term: 'Spring 2025', collected: 285000, pending: 22000, discount: 6000 },
                    { term: 'Fall 2025', collected: 310000, pending: 35000, discount: 8000 },
                    { term: 'Spring 2026', collected: 345000, pending: 45000, discount: 9000 },
                ],
            });
        }
        catch (error) {
            next(error);
        }
    };
    getSystem = async (req, res, next) => {
        try {
            res.status(200).json({
                status: 'success',
                data: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    nodeVersion: process.version,
                    platform: process.platform,
                    health: 'Excellent',
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.ReportsController = ReportsController;
//# sourceMappingURL=reports.controller.js.map