// others
import CONSTANTS from '../constants';

const { STATUS_CODES, REASON_PHRASES } = CONSTANTS;

class SuccessResponse {
  message: string;
  status: number;
  reasonStatusCode: string;
  data?: Record<string, any>;

  constructor({ message, status, reasonStatusCode, data }) {
    this.message = message ? message : reasonStatusCode;
    this.status = status;
    this.reasonStatusCode = reasonStatusCode;
    this.data = data;
  }

  public send(res) {
    return Object.keys(this.data).length > 0
      ? res.status(this.status).json(this)
      : res
          .status(this.status)
          .json({
            message: this.message,
            status: this.status,
            reasonStatusCode: this.reasonStatusCode
          });
  }
}

export class OkSuccess extends SuccessResponse {
  constructor({
    message = '',
    status = STATUS_CODES.OK,
    reasonStatusCode = REASON_PHRASES.OK,
    data = {}
  }) {
    super({ message, status, reasonStatusCode, data });
  }
}

export class CreatedSuccess extends SuccessResponse {
  constructor({
    message = '',
    status = STATUS_CODES.CREATED,
    reasonStatusCode = REASON_PHRASES.CREATED,
    data = {}
  }) {
    super({ message, status, reasonStatusCode, data });
  }
}

export class NoContentSuccess extends SuccessResponse {
  constructor({
    message = '',
    status = STATUS_CODES.NO_CONTENT,
    reasonStatusCode = REASON_PHRASES.NO_CONTENT,
    data = {}
  }) {
    super({ message, status, reasonStatusCode, data });
  }
}
