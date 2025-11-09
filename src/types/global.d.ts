import type { Locale } from "@/shared/locales";

declare global {
  interface ResponsePattern<T> {
    message: string;
    status: number;
    reasonStatusCode: string;
    data?: T;
  }

  namespace Express {
    interface Request {
      locale: Locale;
    }
  }
}

export {};
