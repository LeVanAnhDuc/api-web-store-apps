// libs
import type { Request } from "express";
// others
import { Logger } from "@/utils/logger";

export class LogoutService {
  async logout(req: Request): Promise<void> {
    const userId = req.user?.userId;

    Logger.info("Logout initiated", { userId });
    Logger.info("Logout successful", { userId });
  }
}
