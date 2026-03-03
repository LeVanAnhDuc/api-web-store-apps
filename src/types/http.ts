import type { CookieOptions } from "express";

export interface SetCookie {
  name: string;
  value: string;
  options?: CookieOptions;
}

export interface ClearCookie {
  name: string;
  options?: CookieOptions;
}

export interface HandlerResult<T = unknown> {
  data?: T;
  message?: string;
  statusCode?: number;
  cookies?: SetCookie[];
  clearCookies?: ClearCookie[];
}
