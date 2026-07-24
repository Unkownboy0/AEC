import { z } from 'zod';
export declare const createRoleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    color: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodNumber>;
    hierarchy: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "ARCHIVED", "INACTIVE"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | undefined;
    description?: string | null | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    priority?: number | undefined;
    hierarchy?: number | undefined;
}, {
    name: string;
    status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | undefined;
    description?: string | null | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    priority?: number | undefined;
    hierarchy?: number | undefined;
}>;
export declare const updateRoleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    color: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodNumber>;
    hierarchy: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "ARCHIVED", "INACTIVE"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    priority?: number | undefined;
    hierarchy?: number | undefined;
}, {
    status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    priority?: number | undefined;
    hierarchy?: number | undefined;
}>;
export declare const syncPermissionsSchema: z.ZodObject<{
    permissionIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    permissionIds: string[];
}, {
    permissionIds: string[];
}>;
export declare const bulkAssignUsersSchema: z.ZodObject<{
    userIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    userIds: string[];
}, {
    userIds: string[];
}>;
export declare const createTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    permissionIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    permissionIds: string[];
    description?: string | null | undefined;
}, {
    name: string;
    permissionIds: string[];
    description?: string | null | undefined;
}>;
