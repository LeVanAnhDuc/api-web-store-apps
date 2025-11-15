import type { TFunction } from "i18next";

declare global {
  interface ResponsePattern<T> {
    message: string;
    timestamp: string;
    route: string;
    data?: T;
  }

  interface ErrorPattern {
    timestamp: string;
    route: string;
    error: {
      code: string;
      message: string;
    };
  }

  namespace Express {
    interface Request {
      language: string;
      t: TFunction;
    }
  }
}

export {};
