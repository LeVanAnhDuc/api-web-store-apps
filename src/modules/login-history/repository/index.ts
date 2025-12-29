/**
 * LoginHistory Repository
 * Encapsulates LoginHistory model database operations
 * This is an append-only audit log - no updates allowed
 */

// types
import type { Schema } from "mongoose";
import type {
  LoginHistoryDocument,
  CreateLoginHistoryInput,
  LoginHistoryResponse,
  LoginHistoryFilter
} from "@/shared/types/modules/login-history";

// models
import LoginHistoryModel from "@/modules/login-history/model";

// constants
import { LOGIN_STATUSES } from "@/shared/constants/modules/session";

/**
 * Create a new login history entry
 * This is an append-only operation - audit logs should never be modified
 * @param data - Login history creation data
 * @returns Created login history document
 */
export const createLoginHistory = async (
  data: CreateLoginHistoryInput
): Promise<LoginHistoryDocument> => LoginHistoryModel.create(data);

/**
 * Find login history entries by user ID
 * @param userId - User (Auth) ID
 * @param limit - Maximum number of entries to return
 * @returns Array of login history documents
 */
export const findByUserId = async (
  userId: string | Schema.Types.ObjectId,
  limit = 50
): Promise<LoginHistoryDocument[]> =>
  LoginHistoryModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();

/**
 * Find login history entries with filters
 * @param filter - Filter options
 * @returns Array of login history documents
 */
export const findWithFilter = async (
  filter: LoginHistoryFilter
): Promise<LoginHistoryDocument[]> => {
  const query: Record<string, unknown> = {};

  if (filter.userId) query.userId = filter.userId;
  if (filter.method) query.method = filter.method;
  if (filter.status) query.status = filter.status;

  if (filter.startDate || filter.endDate) {
    query.createdAt = {};
    if (filter.startDate) {
      (query.createdAt as Record<string, Date>).$gte = filter.startDate;
    }
    if (filter.endDate) {
      (query.createdAt as Record<string, Date>).$lte = filter.endDate;
    }
  }

  return LoginHistoryModel.find(query)
    .sort({ createdAt: -1 })
    .skip(filter.offset || 0)
    .limit(filter.limit || 50)
    .exec();
};

/**
 * Count failed login attempts for security analysis
 * @param userId - User (Auth) ID
 * @param since - Count attempts since this date
 * @returns Number of failed attempts
 */
export const countFailedAttempts = async (
  userId: string | Schema.Types.ObjectId,
  since: Date
): Promise<number> =>
  LoginHistoryModel.countDocuments({
    userId,
    status: LOGIN_STATUSES.FAILED,
    createdAt: { $gte: since }
  });

/**
 * Count failed login attempts by IP for security analysis
 * @param ip - IP address
 * @param since - Count attempts since this date
 * @returns Number of failed attempts
 */
export const countFailedAttemptsByIp = async (
  ip: string,
  since: Date
): Promise<number> =>
  LoginHistoryModel.countDocuments({
    ip,
    status: LOGIN_STATUSES.FAILED,
    createdAt: { $gte: since }
  });

/**
 * Get recent successful logins for a user
 * @param userId - User (Auth) ID
 * @param limit - Maximum number of entries
 * @returns Array of successful login entries
 */
export const getRecentSuccessfulLogins = async (
  userId: string | Schema.Types.ObjectId,
  limit = 10
): Promise<LoginHistoryDocument[]> =>
  LoginHistoryModel.find({
    userId,
    status: LOGIN_STATUSES.SUCCESS
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();

/**
 * Get the last successful login for a user
 * @param userId - User (Auth) ID
 * @returns Last successful login or null
 */
export const getLastSuccessfulLogin = async (
  userId: string | Schema.Types.ObjectId
): Promise<LoginHistoryDocument | null> =>
  LoginHistoryModel.findOne({
    userId,
    status: LOGIN_STATUSES.SUCCESS
  })
    .sort({ createdAt: -1 })
    .exec();

/**
 * Transform login history document to API response format
 * @param history - Login history document
 * @returns Login history response object
 */
export const toLoginHistoryResponse = (
  history: LoginHistoryDocument
): LoginHistoryResponse => ({
  id: history._id.toString(),
  method: history.method,
  status: history.status,
  failReason: history.failReason,
  device: history.device,
  ip: history.ip,
  location: history.location,
  createdAt: history.createdAt
});
