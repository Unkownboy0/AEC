"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MastersController = void 0;
const prisma_1 = require("../../lib/prisma");
const exceptions_1 = require("../../utils/exceptions");
class MastersController {
    /**
     * List records by type
     */
    list = async (req, res, next) => {
        try {
            const type = req.query.type;
            if (!type) {
                throw new exceptions_1.BadRequestException('Master data type query parameter is required');
            }
            const records = await prisma_1.prisma.masterRecord.findMany({
                where: { type },
                orderBy: { value: 'asc' },
            });
            res.status(200).json({
                status: 'success',
                data: records,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Create master record
     */
    create = async (req, res, next) => {
        try {
            const { type, value, extra } = req.body;
            if (!type || !value) {
                throw new exceptions_1.BadRequestException('type and value are required in body');
            }
            // Check duplicate
            const existing = await prisma_1.prisma.masterRecord.findUnique({
                where: { type_value: { type, value } },
            });
            if (existing) {
                throw new exceptions_1.BadRequestException(`Value '${value}' already exists for type '${type}'`);
            }
            const record = await prisma_1.prisma.masterRecord.create({
                data: {
                    type,
                    value,
                    extra: extra ? JSON.stringify(extra) : null,
                },
            });
            res.status(201).json({
                status: 'success',
                data: record,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Delete master record
     */
    delete = async (req, res, next) => {
        try {
            await prisma_1.prisma.masterRecord.delete({
                where: { id: req.params.id },
            });
            res.status(200).json({
                status: 'success',
                message: 'Master record deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.MastersController = MastersController;
//# sourceMappingURL=masters.controller.js.map