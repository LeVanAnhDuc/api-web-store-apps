import type { ValidationErrorItem } from "@/types/common";

declare global {
  interface TranslateFunction {
    (key: I18n.Key, options?: Record<string, unknown>): string;
    (
      key: I18n.Key,
      defaultValue: string,
      options?: Record<string, unknown>
    ): string;
  }

  interface ResponsePattern<T> {
    message: string;
    timestamp: string;
    route: string;
    data?: T;
  }

  interface ErrorPattern {
    code: string;
    message: string;
    timestamp: string;
    path: string;
    errors?: ValidationErrorItem[];
  }

  interface JwtUserPayload {
    userId: string;
    authId: string;
    email: string;
    roles: string;
    fullName: string;
    avatar?: string | null;
  }

  interface JwtTokenPayload extends JwtUserPayload {
    iat?: number;
    exp?: number;
  }

  namespace Express {
    interface Request {
      requestId: string;
      language: string;
      t: TranslateFunction;
      user?: JwtUserPayload;
    }
  }
}

export {};
