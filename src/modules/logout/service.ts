import type { Request } from "express";
import { Logger } from "@/utils/logger";

export const logoutService = async (
  req: Request
): Promise<Partial<ResponsePattern<{ success: boolean }>>> => {
  const { t } = req;
  const userId = req.user?.userId;

  Logger.info("Logout initiated", { userId });
  Logger.info("Logout successful", { userId });

  return {
    message: t("logout:success.logoutSuccessful"),
    data: { success: true }
  };
};
