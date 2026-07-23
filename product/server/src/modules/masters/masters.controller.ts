import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { BadRequestException } from '../../utils/exceptions';

export class MastersController {
  /**
   * List records by type
   */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.query.type as string;
      if (!type) {
        throw new BadRequestException('Master data type query parameter is required');
      }

      const records = await prisma.masterRecord.findMany({
        where: { type },
        orderBy: { value: 'asc' },
      });

      res.status(200).json({
        status: 'success',
        data: records,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create master record
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, value, extra } = req.body;
      if (!type || !value) {
        throw new BadRequestException('type and value are required in body');
      }

      // Check duplicate
      const existing = await prisma.masterRecord.findUnique({
        where: { type_value: { type, value } },
      });
      if (existing) {
        throw new BadRequestException(`Value '${value}' already exists for type '${type}'`);
      }

      const record = await prisma.masterRecord.create({
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
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete master record
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.masterRecord.delete({
        where: { id: req.params.id },
      });

      res.status(200).json({
        status: 'success',
        message: 'Master record deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
