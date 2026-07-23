"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerErrorException = exports.ConflictException = exports.NotFoundException = exports.ForbiddenException = exports.UnauthorizedException = exports.BadRequestException = exports.HttpException = void 0;
class HttpException extends Error {
    status;
    errors;
    constructor(status, message, errors) {
        super(message);
        this.status = status;
        this.errors = errors;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.HttpException = HttpException;
class BadRequestException extends HttpException {
    constructor(message = 'Bad Request', errors) {
        super(400, message, errors);
    }
}
exports.BadRequestException = BadRequestException;
class UnauthorizedException extends HttpException {
    constructor(message = 'Unauthorized') {
        super(401, message);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends HttpException {
    constructor(message = 'Forbidden') {
        super(403, message);
    }
}
exports.ForbiddenException = ForbiddenException;
class NotFoundException extends HttpException {
    constructor(message = 'Resource Not Found') {
        super(404, message);
    }
}
exports.NotFoundException = NotFoundException;
class ConflictException extends HttpException {
    constructor(message = 'Conflict') {
        super(409, message);
    }
}
exports.ConflictException = ConflictException;
class InternalServerErrorException extends HttpException {
    constructor(message = 'Internal Server Error') {
        super(500, message);
    }
}
exports.InternalServerErrorException = InternalServerErrorException;
//# sourceMappingURL=exceptions.js.map