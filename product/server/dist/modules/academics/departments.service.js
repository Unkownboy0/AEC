"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentsService = void 0;
const departments_repository_1 = require("./departments.repository");
const exceptions_1 = require("../../utils/exceptions");
const prisma_1 = require("../../lib/prisma");
class DepartmentsService {
    repo = new departments_repository_1.DepartmentsRepository();
    /**
     * List all departments
     */
    async listDepartments(params) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        return this.repo.findAll({
            page,
            pageSize,
            search: params.search,
            type: params.type,
            status: params.status,
            showDeleted: params.showDeleted === 'true',
            sortBy: params.sortBy,
            sortOrder: params.sortOrder === 'asc' ? 'asc' : 'desc'
        });
    }
    /**
     * Get department details
     */
    async getDepartment(id) {
        const dept = await this.repo.findById(id);
        if (!dept)
            throw new exceptions_1.NotFoundException('Department not found');
        return dept;
    }
    /**
     * Create department
     */
    async createDepartment(data, triggeredByUserId, ip, ua) {
        const existingCode = await this.repo.findByCode(data.code);
        if (existingCode)
            throw new exceptions_1.BadRequestException(`Department code '${data.code}' is already registered`);
        const existingName = await prisma_1.prisma.department.findFirst({ where: { name: data.name } });
        if (existingName)
            throw new exceptions_1.BadRequestException(`Department name '${data.name}' already exists`);
        const dept = await this.repo.create(data);
        // Audit log
        await prisma_1.prisma.userActivityLog.create({
            data: {
                userId: triggeredByUserId,
                action: 'CREATE',
                module: 'ACADEMIC',
                description: `Created department '${dept.name}' (${dept.code})`,
                ipAddress: ip,
                userAgent: ua
            }
        });
        return dept;
    }
    /**
     * Update department
     */
    async updateDepartment(id, data, triggeredByUserId, ip, ua) {
        const dept = await this.repo.findById(id);
        if (!dept)
            throw new exceptions_1.NotFoundException('Department not found');
        if (data.code && data.code !== dept.code) {
            const existingCode = await this.repo.findByCode(data.code);
            if (existingCode)
                throw new exceptions_1.BadRequestException(`Department code '${data.code}' is already registered`);
        }
        if (data.name && data.name !== dept.name) {
            const existingName = await prisma_1.prisma.department.findFirst({ where: { name: data.name } });
            if (existingName)
                throw new exceptions_1.BadRequestException(`Department name '${data.name}' already exists`);
        }
        const updated = await this.repo.update(id, data);
        // Audit log
        await prisma_1.prisma.userActivityLog.create({
            data: {
                userId: triggeredByUserId,
                action: 'UPDATE',
                module: 'ACADEMIC',
                description: `Updated department '${dept.name}' details`,
                ipAddress: ip,
                userAgent: ua
            }
        });
        return updated;
    }
    /**
     * Soft delete department
     */
    async deleteDepartment(id, triggeredByUserId, ip, ua) {
        const dept = await this.repo.findById(id);
        if (!dept)
            throw new exceptions_1.NotFoundException('Department not found');
        await this.repo.softDelete(id);
        // Audit log
        await prisma_1.prisma.userActivityLog.create({
            data: {
                userId: triggeredByUserId,
                action: 'DELETE',
                module: 'ACADEMIC',
                description: `Soft deleted department '${dept.name}'`,
                ipAddress: ip,
                userAgent: ua
            }
        });
        return { success: true };
    }
    /**
     * Restore department
     */
    async restoreDepartment(id, triggeredByUserId, ip, ua) {
        const dept = await this.repo.findById(id);
        if (!dept)
            throw new exceptions_1.NotFoundException('Department not found');
        await this.repo.restore(id);
        // Audit log
        await prisma_1.prisma.userActivityLog.create({
            data: {
                userId: triggeredByUserId,
                action: 'UPDATE',
                module: 'ACADEMIC',
                description: `Restored department '${dept.name}'`,
                ipAddress: ip,
                userAgent: ua
            }
        });
        return { success: true };
    }
    /**
     * Bulk delete
     */
    async bulkDelete(ids, triggeredByUserId, ip, ua) {
        await this.repo.bulkSoftDelete(ids);
        await prisma_1.prisma.userActivityLog.create({
            data: {
                userId: triggeredByUserId,
                action: 'DELETE',
                module: 'ACADEMIC',
                description: `Bulk soft deleted ${ids.length} departments`,
                ipAddress: ip,
                userAgent: ua
            }
        });
        return { success: true };
    }
    /**
     * Bulk archive
     */
    async bulkArchive(ids, triggeredByUserId, ip, ua) {
        await this.repo.bulkArchive(ids);
        await prisma_1.prisma.userActivityLog.create({
            data: {
                userId: triggeredByUserId,
                action: 'UPDATE',
                module: 'ACADEMIC',
                description: `Bulk archived ${ids.length} departments`,
                ipAddress: ip,
                userAgent: ua
            }
        });
        return { success: true };
    }
    /**
     * CSV / Excel bulk import validation & parsing
     */
    async importDepartments(rows, triggeredByUserId, ip, ua) {
        const reports = [];
        const validRows = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const lineNum = i + 1;
            if (!row.name || !row.code || !row.type) {
                reports.push(`Row ${lineNum}: Missing required fields (name, code, type)`);
                continue;
            }
            // Check duplicates in payload
            const dupInPayload = validRows.find((vr) => vr.code === row.code.toUpperCase() || vr.name === row.name);
            if (dupInPayload) {
                reports.push(`Row ${lineNum}: Duplicate name/code in import file`);
                continue;
            }
            // Check duplicate code in DB
            const dbDupCode = await this.repo.findByCode(row.code.toUpperCase());
            if (dbDupCode) {
                reports.push(`Row ${lineNum}: Department code '${row.code}' already exists in database`);
                continue;
            }
            const dbDupName = await prisma_1.prisma.department.findFirst({ where: { name: row.name } });
            if (dbDupName) {
                reports.push(`Row ${lineNum}: Department name '${row.name}' already exists in database`);
                continue;
            }
            validRows.push({
                name: row.name,
                code: row.code.toUpperCase(),
                shortName: row.shortName || row.code.toUpperCase(),
                description: row.description || null,
                type: row.type,
                color: row.color || '#6366f1',
                email: row.email || null,
                phone: row.phone || null,
                website: row.website || null,
                officeLocation: row.officeLocation || null,
                establishedYear: row.establishedYear ? parseInt(row.establishedYear) : null,
            });
        }
        if (validRows.length > 0) {
            await prisma_1.prisma.department.createMany({
                data: validRows
            });
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: triggeredByUserId,
                    action: 'CREATE',
                    module: 'ACADEMIC',
                    description: `Bulk imported ${validRows.length} departments via CSV/Excel`,
                    ipAddress: ip,
                    userAgent: ua
                }
            });
        }
        return {
            importedCount: validRows.length,
            errors: reports
        };
    }
}
exports.DepartmentsService = DepartmentsService;
//# sourceMappingURL=departments.service.js.map