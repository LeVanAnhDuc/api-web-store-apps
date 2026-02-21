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
    timestamp: string;
    route: string;
    error: {
      code: string;
      message: string;
    };
  }

  interface JwtUserPayload {
    userId: string;
    authId: string;
    email: string;
    roles: string;
  }

  interface JwtTokenPayload extends JwtUserPayload {
    iat?: number;
    exp?: number;
  }

  namespace Express {
    interface Request {
      language: string;
      t: TranslateFunction;
      user?: JwtUserPayload;
    }
  }
}

export {};
