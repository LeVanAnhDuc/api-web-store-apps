// types
import type { ValidationErrorItem } from "@/types/common";
// common
import { REASON_PHRASES, STATUS_CODES } from "@/common/http";
// others
import { ERROR_CODES } from "@/constants/error-code";

export class ErrorResponse extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors: ValidationErrorItem[];

  constructor({
    status = STATUS_CODES.INTERNAL_SERVER_ERROR,
    code = ERROR_CODES.INTERNAL_SERVER_ERROR,
    message = "An unexpected error occurred",
    errors = []
  }: {
    status: number;
    message: string;
    code?: string;
    errors?: ValidationErrorItem[];
  }) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export class ConflictRequestError extends ErrorResponse {
  constructor(
    message: string = REASON_PHRASES.CONFLICT,
    code: string = ERROR_CODES.CONFLICT
  ) {
    super({ message, status: STATUS_CODES.CONFLICT, code });
  }
}

export class BadRequestError extends ErrorResponse {
  constructor(
    message: string = REASON_PHRASES.BAD_REQUEST,
    code: string = ERROR_CODES.BAD_REQUEST
  ) {
    super({ message, status: STATUS_CODES.BAD_REQUEST, code });
  }
}

export class ForbiddenError extends ErrorResponse {
  constructor(
    message: string = REASON_PHRASES.FORBIDDEN,
    code: string = ERROR_CODES.FORBIDDEN
  ) {
    super({ message, status: STATUS_CODES.FORBIDDEN, code });
  }
}

export class NotFoundError extends ErrorResponse {
  constructor(
    message: string = REASON_PHRASES.NOT_FOUND,
    code: string = ERROR_CODES.NOT_FOUND
  ) {
    super({ message, status: STATUS_CODES.NOT_FOUND, code });
  }
}

export class UnauthorizedError extends ErrorResponse {
  constructor(
    message: string = REASON_PHRASES.UNAUTHORIZED,
    code: string = ERROR_CODES.UNAUTHORIZED
  ) {
    super({ message, status: STATUS_CODES.UNAUTHORIZED, code });
  }
}

export class RedisError extends ErrorResponse {
  constructor(
    message: string = REASON_PHRASES.INTERNAL_SERVER_ERROR,
    code: string = ERROR_CODES.REDIS_ERROR
  ) {
    super({ message, status: STATUS_CODES.INTERNAL_SERVER_ERROR, code });
  }
}

export class TooManyRequestsError extends ErrorResponse {
  constructor(
    message: string = REASON_PHRASES.TOO_MANY_REQUESTS,
    code: string = ERROR_CODES.TOO_MANY_REQUESTS
  ) {
    super({ message, status: STATUS_CODES.TOO_MANY_REQUESTS, code });
  }
}

export class InternalServerError extends ErrorResponse {
  constructor(
    message: string = REASON_PHRASES.INTERNAL_SERVER_ERROR,
    code: string = ERROR_CODES.INTERNAL_SERVER_ERROR
  ) {
    super({ message, status: STATUS_CODES.INTERNAL_SERVER_ERROR, code });
  }
}

export class ServiceUnavailableError extends ErrorResponse {
  constructor(
    message: string = REASON_PHRASES.SERVICE_UNAVAILABLE,
    code: string = ERROR_CODES.SERVICE_UNAVAILABLE
  ) {
    super({ message, status: STATUS_CODES.SERVICE_UNAVAILABLE, code });
  }
}

export class DatabaseError extends ErrorResponse {
  readonly operation: string;
  override readonly cause: unknown;

  constructor(operation: string, cause: unknown) {
    super({
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.DATABASE_ERROR,
      message: REASON_PHRASES.INTERNAL_SERVER_ERROR
    });
    this.name = "DatabaseError";
    this.operation = operation;
    this.cause = cause;
  }
}

export class ValidationError extends ErrorResponse {
  constructor(
    message: string = REASON_PHRASES.BAD_REQUEST,
    errors: ValidationErrorItem[] = [],
    code: string = ERROR_CODES.VALIDATION_ERROR
  ) {
    super({ message, status: STATUS_CODES.BAD_REQUEST, code, errors });
  }
}
