// types
import type { FilterQuery } from "mongoose";
import type { AdminAppsQuery, WebAppDocument } from "../types";
// modules
import { WEB_APP_STATUSES } from "../constants";

const PUBLIC_TO_STATUS = {
  active: WEB_APP_STATUSES.ACTIVE,
  inactive: WEB_APP_STATUSES.INACTIVE
} as const;

export const buildWebAppFilter = (
  query: AdminAppsQuery
): FilterQuery<WebAppDocument> => {
  const filter: FilterQuery<WebAppDocument> = {};

  if (query.status) filter.status = PUBLIC_TO_STATUS[query.status];
  if (query.categoryId) filter.categoryId = query.categoryId;

  if (query.search) {
    const searchRegex = { $regex: query.search, $options: "i" };
    filter.$or = [
      { name: searchRegex },
      { displayName: searchRegex },
      { description: searchRegex }
    ];
  }

  return filter;
};
