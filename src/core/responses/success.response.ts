// libs
import type { Response } from "express";
// constants
import CONSTANTS from "../constants";

const { STATUS_CODES, REASON_PHRASES } = CONSTANTS;

abstract class SuccessResponse<T> {
  private readonly message: string;
  private readonly status: number;
  private readonly reasonStatusCode: string;
  private readonly data: T;

  constructor({
    message,
    status,
    reasonStatusCode,
    data
  }: Partial<ResponsePattern<T>>) {
    this.message = message || reasonStatusCode;
    this.status = status;
    this.reasonStatusCode = reasonStatusCode;
    this.data = data;
  }

  public send = (res: Response) => res.status(this.status).json(this);
}

export class OkSuccess<T> extends SuccessResponse<T> {
  constructor({
    message = "",
    status = STATUS_CODES.OK,
    reasonStatusCode = REASON_PHRASES.OK,
    data = undefined
  }: Partial<ResponsePattern<T>>) {
    super({ message, status, reasonStatusCode, data });
  }
}

export class CreatedSuccess<T> extends SuccessResponse<T> {
  constructor({
    message = "",
    status = STATUS_CODES.CREATED,
    reasonStatusCode = REASON_PHRASES.CREATED,
    data = undefined
  }: Partial<ResponsePattern<T>>) {
    super({ message, status, reasonStatusCode, data });
  }
}

export class NoContentSuccess<T> extends SuccessResponse<T> {
  constructor({
    message = "",
    status = STATUS_CODES.NO_CONTENT,
    reasonStatusCode = REASON_PHRASES.NO_CONTENT,
    data = undefined
  }: Partial<ResponsePattern<T>>) {
    super({ message, status, reasonStatusCode, data });
  }
}
