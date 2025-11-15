// libs
import type { Response, Request } from "express";
// constants
import { STATUS_CODES } from "@/core/constants/http";

interface SuccessResponsePattern<T> extends ResponsePattern<T> {
  status: number;
}

abstract class SuccessResponse<T> {
  route: string;
  timestamp: string;
  private readonly status: number;
  private readonly message: string;
  private readonly data: T;

  constructor({
    route,
    timestamp,
    data,
    status,
    message
  }: Partial<SuccessResponsePattern<T>>) {
    this.timestamp = timestamp;
    this.route = route;
    this.status = status;
    this.message = message;
    this.data = data;
  }

  public send = (req: Request, res: Response) =>
    res.status(this.status).json({
      timestamp: new Date().toISOString(),
      route: req.originalUrl,
      message: this.message,
      data: this.data
    });
}

export class OkSuccess<T> extends SuccessResponse<T> {
  constructor({
    message = "",
    status = STATUS_CODES.OK,
    data = undefined
  }: Partial<SuccessResponsePattern<T>>) {
    super({ message, status, data });
  }
}

export class CreatedSuccess<T> extends SuccessResponse<T> {
  constructor({
    message = "",
    status = STATUS_CODES.CREATED,
    data = undefined
  }: Partial<SuccessResponsePattern<T>>) {
    super({ message, status, data });
  }
}

export class NoContentSuccess<T> extends SuccessResponse<T> {
  constructor({
    message = "",
    status = STATUS_CODES.NO_CONTENT,
    data = undefined
  }: Partial<SuccessResponsePattern<T>>) {
    super({ message, status, data });
  }
}
