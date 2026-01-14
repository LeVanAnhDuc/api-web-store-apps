import { REASON_PHRASES, STATUS_CODES } from "@/infra/http";

export class ErrorResponse extends Error {
  readonly status: number;
  readonly timestamp: string;
  readonly route: string;
  readonly error: { code?: string; message: string };

  constructor({
    status = STATUS_CODES.INTERNAL_SERVER_ERROR,
    code = "INTERNAL_SERVER_ERROR",
    message = "An unexpected error occurred"
  }: {
    status: number;
    message: string;
    code?: string;
  }) {
    super(message);
    this.status = status;
    this.error = {
      code,
      message
    };
  }
}

export class ConflictRequestError extends ErrorResponse {
  constructor(message = REASON_PHRASES.CONFLICT, code = "CONFLICT") {
    super({ message, status: STATUS_CODES.CONFLICT, code });
  }
}

export class BadRequestError extends ErrorResponse {
  constructor(message = REASON_PHRASES.BAD_REQUEST, code = "BAD_REQUEST") {
    super({ message, status: STATUS_CODES.BAD_REQUEST, code });
  }
}

export class ForbiddenError extends ErrorResponse {
  constructor(message = REASON_PHRASES.FORBIDDEN, code = "FORBIDDEN") {
    super({ message, status: STATUS_CODES.FORBIDDEN, code });
  }
}

export class NotFoundError extends ErrorResponse {
  constructor(message = REASON_PHRASES.NOT_FOUND, code = "NOT_FOUND") {
    super({ message, status: STATUS_CODES.NOT_FOUND, code });
  }
}

export class UnauthorizedError extends ErrorResponse {
  constructor(message = REASON_PHRASES.UNAUTHORIZED, code = "UNAUTHORIZED") {
    super({ message, status: STATUS_CODES.UNAUTHORIZED, code });
  }
}

export class RedisError extends ErrorResponse {
  constructor(
    message = REASON_PHRASES.INTERNAL_SERVER_ERROR,
    code = "REDIS_ERROR"
  ) {
    super({ message, status: STATUS_CODES.INTERNAL_SERVER_ERROR, code });
  }
}

export class TooManyRequestsError extends ErrorResponse {
  constructor(
    message = REASON_PHRASES.TOO_MANY_REQUESTS,
    code = "TOO_MANY_REQUESTS"
  ) {
    super({ message, status: STATUS_CODES.TOO_MANY_REQUESTS, code });
  }
}

export class ServiceUnavailableError extends ErrorResponse {
  constructor(
    message = REASON_PHRASES.SERVICE_UNAVAILABLE,
    code = "SERVICE_UNAVAILABLE"
  ) {
    super({ message, status: STATUS_CODES.SERVICE_UNAVAILABLE, code });
  }
}

/**
 * Validation Error with field-level error details
 * Used for form validation failures
 */
export interface FieldError {
  field: string;
  message: string;
}

export class ValidationError extends ErrorResponse {
  readonly fields: FieldError[];

  constructor(
    message = REASON_PHRASES.BAD_REQUEST,
    fields: FieldError[] = [],
    code = "VALIDATION_ERROR"
  ) {
    super({ message, status: STATUS_CODES.BAD_REQUEST, code });
    this.fields = fields;
  }
}
