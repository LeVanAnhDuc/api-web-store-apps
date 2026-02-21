import jwt, {
  type Secret,
  type PrivateKey,
  type PublicKey
} from "jsonwebtoken";
import type { TExpiresIn, TPayload } from "@/types/jwt";
import { ForbiddenError } from "@/configurations/responses/error";
import { TOKEN_EXPIRY, TOKEN_ERRORS } from "@/constants/infrastructure";
import ENV from "@/configurations/env";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

const enum TokenType {
  ACCESS = "ACCESS",
  REFRESH = "REFRESH",
  ID_TOKEN = "ID_TOKEN"
}

interface TokenConfig {
  secret: Secret | PrivateKey;
  expiresIn: TExpiresIn;
}

const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  [TokenType.ACCESS]: {
    secret: ENV.JWT_ACCESS_SECRET,
    expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
  },
  [TokenType.REFRESH]: {
    secret: ENV.JWT_REFRESH_SECRET,
    expiresIn: TOKEN_EXPIRY.NUMBER_REFRESH_TOKEN
  },
  [TokenType.ID_TOKEN]: {
    secret: ENV.JWT_ID_SECRET,
    expiresIn: TOKEN_EXPIRY.NUMBER_ID_TOKEN
  }
} as const;

const ERROR_TRANSLATION_KEYS: Record<string, I18n.Key> = {
  [TOKEN_ERRORS.JSON_WEB_TOKEN_ERROR]: "common:errors.invalidToken",
  [TOKEN_ERRORS.TOKEN_EXPIRED_ERROR]: "common:errors.tokenExpired"
} as const;

export class JsonWebTokenService {
  private static generateToken(payload: TPayload, type: TokenType): string {
    const { secret, expiresIn } = TOKEN_CONFIGS[type];
    return jwt.sign(payload, secret, { expiresIn });
  }

  private static verifyToken<T = TPayload>(token: string, type: TokenType): T {
    try {
      const { secret } = TOKEN_CONFIGS[type];
      const payload = jwt.verify(token, secret as Secret | PublicKey);
      return payload as T;
    } catch (error) {
      const errorName = error instanceof Error ? error.name : "UnknownError";
      const translationKey = ERROR_TRANSLATION_KEYS[errorName];

      if (translationKey) {
        throw new ForbiddenError(translationKey);
      }

      const errorMessage =
        error instanceof Error ? error.message : "Token verification failed";
      throw new ForbiddenError(errorMessage);
    }
  }

  static generateAccessToken(payload: TPayload): string {
    return this.generateToken(payload, TokenType.ACCESS);
  }

  static generateRefreshToken(payload: TPayload): string {
    return this.generateToken(payload, TokenType.REFRESH);
  }

  static generateIdToken(payload: TPayload): string {
    return this.generateToken(payload, TokenType.ID_TOKEN);
  }

  static generateAuthTokens(payload: TPayload): AuthTokens {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      idToken: this.generateIdToken(payload)
    };
  }

  static verifyAccessToken<T = TPayload>(token: string): T {
    return this.verifyToken<T>(token, TokenType.ACCESS);
  }

  static verifyRefreshToken<T = TPayload>(token: string): T {
    return this.verifyToken<T>(token, TokenType.REFRESH);
  }

  static verifyIdToken<T = TPayload>(token: string): T {
    return this.verifyToken<T>(token, TokenType.ID_TOKEN);
  }
}
