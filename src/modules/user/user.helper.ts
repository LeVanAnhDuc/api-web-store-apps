// others
import { USER_CONFIG } from "@/constants/config";

export function buildAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath) return null;
  return `${USER_CONFIG.BASE_URL}/${avatarPath}`;
}
