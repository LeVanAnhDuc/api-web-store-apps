import type { Request } from "express";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

export interface LoginBody {
  email: string;
  password: string;
}

export type LoginRequest = Request<Record<string, never>, unknown, LoginBody>;
