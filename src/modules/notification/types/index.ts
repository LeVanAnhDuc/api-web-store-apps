// types
import type { Request } from "express";
import type { Schema } from "mongoose";
import type { NOTIFICATION_TYPES } from "@/modules/notification/constants";

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export interface NotificationDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  meta: Record<string, unknown> | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationListQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
  sortOrder?: "asc" | "desc";
}

export interface NotificationFilter {
  userId: string;
  isRead?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface NotificationListRequest extends Omit<Request, "query"> {
  query: NotificationListQuery;
}

export interface NotificationIdParams {
  id: string;
}

export interface NotificationIdRequest extends Omit<Request, "params"> {
  params: NotificationIdParams;
}
