// types
import type { Response } from "express";
// config
import { STATUS_CODES } from "@/config/http";

interface SuccessResponsePattern<T> extends ResponsePattern<T> {
  status: number;
}

interface RequestLike {
  originalUrl: string;
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

  public send = (req: RequestLike, res: Response): void => {
    res.status(this.status).json({
      timestamp: new Date().toISOString(),
      route: req.originalUrl,
      message: this.message,
      data: this.data
    });
  };
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

export class NoContentSuccess extends SuccessResponse<undefined> {
  constructor() {
    super({ status: STATUS_CODES.NO_CONTENT });
  }

  public send = (_req: RequestLike, res: Response): void => {
    res.status(STATUS_CODES.NO_CONTENT).end();
  };
}
