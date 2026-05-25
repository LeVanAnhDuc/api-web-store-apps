// types
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
