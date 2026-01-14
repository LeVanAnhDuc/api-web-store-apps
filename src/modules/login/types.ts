import type { Request } from "express";
import type { LOGIN_METHODS } from "./constants";

/**
 * Login method type derived from LOGIN_METHODS constant
 */
export type LoginMethod = (typeof LOGIN_METHODS)[keyof typeof LOGIN_METHODS];

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

export interface PasswordLoginBody {
  email: string;
  password: string;
}

export type PasswordLoginRequest = Request<
  Record<string, never>,
  unknown,
  PasswordLoginBody
>;

export interface OtpSendBody {
  email: string;
}

export interface OtpVerifyBody {
  email: string;
  otp: string;
}

export interface OtpSendResponse {
  success: boolean;
  expiresIn: number;
  cooldown: number;
}

export type OtpSendRequest = Request<
  Record<string, never>,
  unknown,
  OtpSendBody
>;

export type OtpVerifyRequest = Request<
  Record<string, never>,
  unknown,
  OtpVerifyBody
>;

export interface MagicLinkSendBody {
  email: string;
}

export interface MagicLinkVerifyBody {
  email: string;
  token: string;
}

export interface MagicLinkSendResponse {
  success: boolean;
  expiresIn: number;
  cooldown: number;
}

export type MagicLinkSendRequest = Request<
  Record<string, never>,
  unknown,
  MagicLinkSendBody
>;

export type MagicLinkVerifyRequest = Request<
  Record<string, never>,
  unknown,
  MagicLinkVerifyBody
>;

export interface UnlockRequestBody {
  email: string;
}

export interface UnlockVerifyBody {
  email: string;
  token: string;
}

export type UnlockRequest = Request<
  Record<string, never>,
  unknown,
  UnlockRequestBody
>;

export type UnlockVerifyRequest = Request<
  Record<string, never>,
  unknown,
  UnlockVerifyBody
>;

/** @deprecated Use PasswordLoginBody instead */
export type LoginBody = PasswordLoginBody;

/** @deprecated Use PasswordLoginRequest instead */
export type LoginRequest = PasswordLoginRequest;
