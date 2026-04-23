// others
import { Logger } from "@/libs/logger";

export class LogoutService {
  async logout(userId: string): Promise<void> {
    Logger.info("Logout successful", { userId });
  }
}
