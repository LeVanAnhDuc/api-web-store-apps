// others
import ENV from "@/constants/env";

export const GENDERS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
  PREFER_NOT_TO_SAY: "prefer_not_to_say"
} as const;

export const USER_CONFIG = {
  AVATAR_MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  AVATAR_UPLOAD_DIR: "uploads/avatars",
  BASE_URL: ENV.BASE_URL
} as const;
