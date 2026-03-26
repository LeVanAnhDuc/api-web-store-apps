import type { LoginHistoryAdminQuery } from "@/types/modules/login-history";
import type { LoginHistoryFilter } from "@/repositories/login-history.repository";

export const buildLoginHistoryFilter = (
  query: LoginHistoryAdminQuery,
  userId?: string
): LoginHistoryFilter => {
  const filter: LoginHistoryFilter = {};

  if (userId) filter.userId = userId;
  else if (query.userId) filter.userId = query.userId;

  if (query.status) filter.status = query.status;
  if (query.method) filter.method = query.method;
  if (query.deviceType) filter.deviceType = query.deviceType;
  if (query.clientType) filter.clientType = query.clientType;
  if (query.country) filter.country = query.country;
  if (query.city) filter.city = query.city;
  if (query.os) filter.os = query.os;
  if (query.browser) filter.browser = query.browser;
  if (query.ip) filter.ip = query.ip;
  if (query.fromDate) filter.fromDate = new Date(query.fromDate);
  if (query.toDate) filter.toDate = new Date(query.toDate);

  return filter;
};
