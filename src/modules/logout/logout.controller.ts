import { Router } from "express";
import type { Request } from "express";
import type { HandlerResult } from "@/types/http";
import type { LogoutService } from "./logout.service";
import type { AuthGuard } from "@/middlewares/auth.guard";
import { asyncHandler } from "@/utils/async-handler";
import { COOKIE_NAMES } from "@/constants/infrastructure";
import ENV from "@/config/env";

export class LogoutController {
  public readonly router = Router();

  constructor(
    private readonly service: LogoutService,
    private readonly auth: AuthGuard
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post("/", this.auth.middleware, asyncHandler(this.logout));
  }

  private logout = async (req: Request): Promise<HandlerResult> => {
    const { data, message } = await this.service.logout(req);

    return {
      data,
      message,
      clearCookies: [
        {
          name: COOKIE_NAMES.REFRESH_TOKEN,
          options: {
            httpOnly: true,
            secure: ENV.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
          }
        }
      ]
    };
  };
}
