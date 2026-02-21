import type { StringValue } from "ms";

export type TPayload = string | Buffer | object;
export type TExpiresIn = StringValue | number;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
}
