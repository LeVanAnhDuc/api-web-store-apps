import type { Request } from "express";

export interface RefreshTokenResponse {
  accessToken: string;
  idToken: string;
  expiresIn: number;
}

export type RefreshTokenRequest = Request<
  Record<string, never>,
  unknown,
  Record<string, never>
>;
