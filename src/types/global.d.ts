import type { TFunction } from "i18next";

declare global {
  interface ResponsePattern<T> {
    message: string;
    status: number;
    reasonStatusCode: string;
    data?: T;
  }

  namespace Express {
    interface Request {
      language: string;
      t: TFunction;
    }
  }
}

export {};
