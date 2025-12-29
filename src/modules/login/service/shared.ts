/**
 * Shared Login Service Helpers
 * Common operations used across different login methods
 */

// libs
import * as bcrypt from "bcrypt";
import crypto from "crypto";
// types
import type { Schema } from "mongoose";
import type { Request } from "express";
import type { AuthDocument } from "@/shared/types/modules/auth";
import type {
  DeviceInfo,
  LocationInfo,
  LoginMethod,
  CreateSessionInput
} from "@/shared/types/modules/session";
import type {
  CreateLoginHistoryInput,
  LoginStatus,
  LoginFailReason
} from "@/shared/types/modules/login-history";
import type { LoginWithSessionResponse } from "@/shared/types/modules/login";

// helpers
import { generatePairToken } from "@/core/helpers/jwt";

// utils
import { Logger } from "@/core/utils/logger";
import { parseUserAgent, getClientIp } from "@/modules/login/utils/device";

// repositories
import {
  createSession,
  isNewDevice,
  isNewLocation,
  toSessionResponse
} from "@/modules/session/repository";
import { createLoginHistory } from "@/modules/login-history/repository";
import { updateLastLogin } from "@/modules/login/repository";

// constants
import { TOKEN_EXPIRY } from "@/core/configs/jwt";
import { LOGIN_SESSION_CONFIG } from "@/shared/constants/modules/session";

/**
 * Extract device info from request
 */
export const extractDeviceInfo = (req: Request): DeviceInfo => {
  const userAgent = req.headers["user-agent"] || "";
  return parseUserAgent(userAgent);
};

/**
 * Extract location info (placeholder - implement with GeoIP service)
 */
export const extractLocationInfo = (_ip: string): LocationInfo | undefined =>
  // TODO: Implement GeoIP lookup
  // For now, return undefined
  undefined;

/**
 * Create session and generate tokens after successful authentication
 */
export const createLoginSession = async ({
  auth,
  loginMethod,
  req
}: {
  auth: AuthDocument;
  loginMethod: LoginMethod;
  req: Request;
}): Promise<LoginWithSessionResponse> => {
  const ip = getClientIp(req);
  const device = extractDeviceInfo(req);
  const location = extractLocationInfo(ip);

  // Generate refresh token (secure random)
  const refreshToken = crypto.randomBytes(32).toString("hex");
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  // Calculate session expiry
  const expiresAt = new Date(
    Date.now() + LOGIN_SESSION_CONFIG.REFRESH_TOKEN_EXPIRY_SECONDS * 1000
  );

  // Check for new device/location (for security alerts) - do this before creating session
  const [newDevice, newLocation] = await Promise.all([
    isNewDevice(auth._id, { browser: device.browser, os: device.os }),
    location?.countryCode
      ? isNewLocation(auth._id, location.countryCode)
      : Promise.resolve(false)
  ]);

  // Create session input
  const sessionInput: CreateSessionInput = {
    userId: auth._id,
    refreshTokenHash,
    device,
    ip,
    location,
    loginMethod,
    expiresAt
  };

  // Create session first to get ID for token payload
  const session = await createSession(sessionInput);

  // Generate tokens with sessionId included
  const tokenPayload = {
    userId: auth._id.toString(),
    authId: auth._id.toString(),
    email: auth.email,
    roles: auth.roles,
    sessionId: session._id.toString()
  };

  const { accessToken, idToken } = generatePairToken(tokenPayload);

  // Update last login
  await updateLastLogin(auth._id.toString());

  Logger.info("Login session created", {
    userId: auth._id.toString(),
    sessionId: session._id.toString(),
    loginMethod,
    isNewDevice: newDevice,
    isNewLocation: newLocation
  });

  return {
    accessToken,
    refreshToken,
    idToken,
    expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN,
    session: toSessionResponse(session, session._id.toString()),
    isNewDevice: newDevice || undefined,
    isNewLocation: newLocation || undefined
  };
};

/**
 * Record successful login in history
 */
export const recordSuccessfulLogin = async ({
  userId,
  loginMethod,
  req
}: {
  userId: Schema.Types.ObjectId | string;
  loginMethod: LoginMethod;
  req: Request;
}): Promise<void> => {
  const ip = getClientIp(req);
  const device = extractDeviceInfo(req);
  const location = extractLocationInfo(ip);
  const userAgent = req.headers["user-agent"] || "unknown";

  const historyInput: CreateLoginHistoryInput = {
    userId,
    method: loginMethod,
    status: "success" as LoginStatus,
    device,
    ip,
    location,
    userAgent
  };

  await createLoginHistory(historyInput);

  Logger.debug("Login success recorded in history", {
    userId: userId.toString(),
    loginMethod
  });
};

/**
 * Record failed login in history
 */
export const recordFailedLogin = async ({
  userId,
  loginMethod,
  failReason,
  req
}: {
  userId?: Schema.Types.ObjectId | string;
  loginMethod: LoginMethod;
  failReason: LoginFailReason;
  req: Request;
}): Promise<void> => {
  // Only record if we know the user
  if (!userId) return;

  const ip = getClientIp(req);
  const device = extractDeviceInfo(req);
  const location = extractLocationInfo(ip);
  const userAgent = req.headers["user-agent"] || "unknown";

  const historyInput: CreateLoginHistoryInput = {
    userId,
    method: loginMethod,
    status: "failed" as LoginStatus,
    failReason,
    device,
    ip,
    location,
    userAgent
  };

  await createLoginHistory(historyInput);

  Logger.debug("Login failure recorded in history", {
    userId: userId.toString(),
    loginMethod,
    failReason
  });
};
