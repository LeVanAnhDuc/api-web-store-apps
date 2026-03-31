// types
import type { FilterQuery } from "mongoose";
import type {
  AdminContactsQuery,
  ContactDocument
} from "@/types/modules/contact-admin";

export const buildContactFilter = (
  query: AdminContactsQuery
): FilterQuery<ContactDocument> => {
  const filter: FilterQuery<ContactDocument> = {};

  // Exact match fields
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;

  // Partial match (case-insensitive regex)
  if (query.email) filter.email = { $regex: query.email, $options: "i" };

  // Text search: OR across subject, email
  if (query.search) {
    const searchRegex = { $regex: query.search, $options: "i" };
    filter.$or = [{ subject: searchRegex }, { email: searchRegex }];
  }

  // Date range
  if (query.fromDate || query.toDate) {
    filter.createdAt = {};
    if (query.fromDate) filter.createdAt.$gte = new Date(query.fromDate);
    if (query.toDate) filter.createdAt.$lte = new Date(query.toDate);
  }

  return filter;
};
