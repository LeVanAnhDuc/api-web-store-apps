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

  /**
   * User payload from JWT token, attached by auth middleware
   * Simplified: No sessionId (stateless JWT auth)
   */
  interface JwtUserPayload {
    userId: string;
    authId: string;
    email: string;
    roles: string;
  }

  namespace Express {
    interface Request {
      language: string;
      t: TFunction;
      user?: JwtUserPayload;
    }
  }
}

export {};
