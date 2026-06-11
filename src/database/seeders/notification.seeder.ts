// models
import NotificationModel from "@/models/notification";
import UserModel from "@/models/user";
// others
import {
  buildSeedNotifications,
  TARGET_USER_EMAIL
} from "./data/notifications";
import { Logger } from "@/libs/logger";

export const seedNotifications = async (): Promise<void> => {
  Logger.info("Starting notification seeding...");
  const user = await UserModel.findOne({ email: TARGET_USER_EMAIL });
  if (!user) {
    Logger.warn(
      `Seed target user ${TARGET_USER_EMAIL} not found; skipping notifications.`
    );
    return;
  }
  const existing = await NotificationModel.countDocuments({
    userId: user._id
  });
  if (existing > 0) {
    Logger.warn(
      `Notifications already exist for ${TARGET_USER_EMAIL}; skipping.`
    );
    return;
  }
  const now = Date.now();
  const docs = buildSeedNotifications().map((n) => ({
    userId: user._id,
    type: n.type,
    title: n.title,
    message: n.message,
    meta: null,
    isRead: n.isRead,
    readAt: n.isRead ? new Date(now - n.ageMs) : null,
    createdAt: new Date(now - n.ageMs)
  }));
  await NotificationModel.insertMany(docs);
  Logger.info(`Created ${docs.length} notifications for ${TARGET_USER_EMAIL}`);
};

export const clearNotifications = async (): Promise<void> => {
  Logger.info("Clearing seeded notifications...");
  const user = await UserModel.findOne({ email: TARGET_USER_EMAIL });
  if (!user) return;
  const res = await NotificationModel.deleteMany({ userId: user._id });
  Logger.info(`Cleared ${res.deletedCount} notifications`);
};
