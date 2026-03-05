import { Types } from "mongoose";
import type { FilterQuery } from "mongoose";
import type { LoginHistoryAdminQuery } from "@/types/modules/login-history";
import type { LoginHistoryDocument } from "@/types/modules/login-history";

export const buildLoginHistoryFilter = (
  query: LoginHistoryAdminQuery,
  userId?: string
): FilterQuery<LoginHistoryDocument> => {
  const filter: FilterQuery<LoginHistoryDocument> = {};

  // Force userId filter for user-scoped queries
  if (userId) {
    filter.userId = new Types.ObjectId(userId);
  } else if (query.userId) {
    filter.userId = new Types.ObjectId(query.userId);
  }

  // Exact match fields
  if (query.status) filter.status = query.status;
  if (query.method) filter.method = query.method;
  if (query.deviceType) filter.deviceType = query.deviceType;
  if (query.clientType) filter.clientType = query.clientType;

  // Partial match (case-insensitive regex)
  if (query.country) filter.country = { $regex: query.country, $options: "i" };
  if (query.city) filter.city = { $regex: query.city, $options: "i" };
  if (query.os) filter.os = { $regex: query.os, $options: "i" };
  if (query.browser) filter.browser = { $regex: query.browser, $options: "i" };
  if (query.ip) filter.ip = { $regex: query.ip, $options: "i" };

  // Date range
  if (query.fromDate || query.toDate) {
    filter.createdAt = {};
    if (query.fromDate) filter.createdAt.$gte = new Date(query.fromDate);
    if (query.toDate) filter.createdAt.$lte = new Date(query.toDate);
  }

  return filter;
};
