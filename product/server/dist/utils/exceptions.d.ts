export declare class HttpException extends Error {
    status: number;
    errors?: any;
    constructor(status: number, message: string, errors?: any);
}
export declare class BadRequestException extends HttpException {
    constructor(message?: string, errors?: any);
}
export declare class UnauthorizedException extends HttpException {
    constructor(message?: string);
}
export declare class ForbiddenException extends HttpException {
    constructor(message?: string);
}
export declare class NotFoundException extends HttpException {
    constructor(message?: string);
}
export declare class ConflictException extends HttpException {
    constructor(message?: string);
}
export declare class InternalServerErrorException extends HttpException {
    constructor(message?: string);
}
