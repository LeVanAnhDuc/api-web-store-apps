// others
import { Logger } from "@/utils/logger";

export class LogoutService {
  async logout(userId: string): Promise<void> {
    Logger.info("Logout successful", { userId });
  }
}
