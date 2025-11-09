// others
import CONSTANTS from "@/shared/constants";

const { STATUS_CODES, REASON_PHRASES } = CONSTANTS;

export class ErrorResponse extends Error {
  private status: number;
  private now: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.now = Date.now();
  }

  public getStatus = () => this.status;
}

export class ConflictRequestError extends ErrorResponse {
  constructor(message = REASON_PHRASES.CONFLICT) {
    super(message, STATUS_CODES.CONFLICT);
  }
}

export class BadRequestError extends ErrorResponse {
  constructor(message = REASON_PHRASES.BAD_REQUEST) {
    super(message, STATUS_CODES.BAD_REQUEST);
  }
}

export class ForbiddenError extends ErrorResponse {
  constructor(message = REASON_PHRASES.FORBIDDEN) {
    super(message, STATUS_CODES.FORBIDDEN);
  }
}

export class NotFoundError extends ErrorResponse {
  constructor(message = REASON_PHRASES.NOT_FOUND) {
    super(message, STATUS_CODES.NOT_FOUND);
  }
}

export class UnauthorizedError extends ErrorResponse {
  constructor(message = REASON_PHRASES.UNAUTHORIZED) {
    super(message, STATUS_CODES.UNAUTHORIZED);
  }
}

export class RedisError extends ErrorResponse {
  constructor(
    message = REASON_PHRASES.INTERNAL_SERVER_ERROR,
    statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR
  ) {
    super(message, statusCode);
  }
}

export class MongoError extends ErrorResponse {
  constructor(
    message = REASON_PHRASES.INTERNAL_SERVER_ERROR,
    statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR
  ) {
    super(message, statusCode);
  }
}
