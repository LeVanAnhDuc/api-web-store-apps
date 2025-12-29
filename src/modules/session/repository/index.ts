/**
 * Session Repository
 * Encapsulates Session model database operations
 * Service layer should NOT query DB directly - use this repository
 */

// types
import type { Schema } from "mongoose";
import type {
  SessionDocument,
  CreateSessionInput,
  SessionResponse
} from "@/shared/types/modules/session";

// models
import SessionModel from "@/modules/session/model";

/**
 * Create a new session
 * @param data - Session creation data
 * @returns Created session document
 */
export const createSession = async (
  data: CreateSessionInput
): Promise<SessionDocument> => {
  const session = await SessionModel.create(data);
  return session;
};

/**
 * Find session by ID
 * @param sessionId - Session ID
 * @returns Session document or null
 */
export const findSessionById = async (
  sessionId: string
): Promise<SessionDocument | null> => SessionModel.findById(sessionId).exec();

/**
 * Find session by ID with refresh token hash (for token verification)
 * @param sessionId - Session ID
 * @returns Session document with refreshTokenHash or null
 */
export const findSessionWithToken = async (
  sessionId: string
): Promise<SessionDocument | null> =>
  SessionModel.findById(sessionId).select("+refreshTokenHash").exec();

/**
 * Find all active sessions for a user
 * @param userId - User (Auth) ID
 * @returns Array of session documents
 */
export const findActiveSessionsByUserId = async (
  userId: string | Schema.Types.ObjectId
): Promise<SessionDocument[]> =>
  SessionModel.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  })
    .sort({ lastActive: -1 })
    .exec();

/**
 * Count active sessions for a user
 * @param userId - User (Auth) ID
 * @returns Number of active sessions
 */
export const countActiveSessionsByUserId = async (
  userId: string | Schema.Types.ObjectId
): Promise<number> =>
  SessionModel.countDocuments({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });

/**
 * Update session last active time
 * @param sessionId - Session ID
 * @returns Updated session document or null
 */
export const updateLastActive = async (
  sessionId: string
): Promise<SessionDocument | null> =>
  SessionModel.findByIdAndUpdate(
    sessionId,
    { lastActive: new Date() },
    { new: true }
  ).exec();

/**
 * Revoke a specific session
 * @param sessionId - Session ID
 * @returns Updated session document or null
 */
export const revokeSession = async (
  sessionId: string
): Promise<SessionDocument | null> =>
  SessionModel.findByIdAndUpdate(
    sessionId,
    {
      isRevoked: true,
      revokedAt: new Date()
    },
    { new: true }
  ).exec();

/**
 * Revoke a session by ID and user ID (for security - ensure user owns session)
 * @param sessionId - Session ID
 * @param userId - User (Auth) ID
 * @returns Updated session document or null
 */
export const revokeSessionByIdAndUserId = async (
  sessionId: string,
  userId: string | Schema.Types.ObjectId
): Promise<SessionDocument | null> =>
  SessionModel.findOneAndUpdate(
    { _id: sessionId, userId },
    {
      isRevoked: true,
      revokedAt: new Date()
    },
    { new: true }
  ).exec();

/**
 * Revoke all sessions for a user (logout from all devices)
 * @param userId - User (Auth) ID
 * @returns Number of revoked sessions
 */
export const revokeAllSessionsByUserId = async (
  userId: string | Schema.Types.ObjectId
): Promise<number> => {
  const result = await SessionModel.updateMany(
    { userId, isRevoked: false },
    {
      isRevoked: true,
      revokedAt: new Date()
    }
  );
  return result.modifiedCount;
};

/**
 * Revoke all sessions except the current one
 * @param userId - User (Auth) ID
 * @param currentSessionId - Current session ID to keep
 * @returns Number of revoked sessions
 */
export const revokeOtherSessions = async (
  userId: string | Schema.Types.ObjectId,
  currentSessionId: string
): Promise<number> => {
  const result = await SessionModel.updateMany(
    { userId, isRevoked: false, _id: { $ne: currentSessionId } },
    {
      isRevoked: true,
      revokedAt: new Date()
    }
  );
  return result.modifiedCount;
};

/**
 * Check if device/location is new for user (for security alerts)
 * @param userId - User (Auth) ID
 * @param deviceFingerprint - Device fingerprint (browser + os)
 * @returns true if device is new
 */
export const isNewDevice = async (
  userId: string | Schema.Types.ObjectId,
  deviceFingerprint: { browser: string; os: string }
): Promise<boolean> => {
  const existingSession = await SessionModel.findOne({
    userId,
    "device.browser": deviceFingerprint.browser,
    "device.os": deviceFingerprint.os
  }).exec();

  return existingSession === null;
};

/**
 * Check if location is new for user (for security alerts)
 * @param userId - User (Auth) ID
 * @param countryCode - Country code
 * @returns true if location is new
 */
export const isNewLocation = async (
  userId: string | Schema.Types.ObjectId,
  countryCode: string
): Promise<boolean> => {
  const existingSession = await SessionModel.findOne({
    userId,
    "location.countryCode": countryCode
  }).exec();

  return existingSession === null;
};

/**
 * Transform session document to API response format
 * @param session - Session document
 * @param currentSessionId - Optional current session ID to mark as current
 * @returns Session response object
 */
export const toSessionResponse = (
  session: SessionDocument,
  currentSessionId?: string
): SessionResponse => ({
  id: session._id.toString(),
  device: session.device,
  ip: session.ip,
  location: session.location,
  loginMethod: session.loginMethod,
  lastActive: session.lastActive,
  createdAt: session.createdAt,
  isCurrent: currentSessionId
    ? session._id.toString() === currentSessionId
    : undefined
});

/**
 * Delete expired or revoked sessions for cleanup job
 * @param olderThan - Delete sessions with lastActive older than this date
 * @returns Number of deleted sessions
 */
export const deleteInactiveSessions = async (
  olderThan: Date
): Promise<number> => {
  const result = await SessionModel.deleteMany({
    $or: [{ isRevoked: true }, { lastActive: { $lt: olderThan } }]
  });
  return result.deletedCount;
};
