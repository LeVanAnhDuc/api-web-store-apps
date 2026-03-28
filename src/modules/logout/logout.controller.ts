// libs
import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";

// types
import type { LogoutService } from "./logout.service";

// config
import { NoContentSuccess } from "@/config/responses/success";
import ENV from "@/config/env";

// utils
import { asyncHandler } from "@/utils/async-handler";

// others
import { REFRESH_TOKEN } from "@/constants/modules/token";

export class LogoutController {
  public readonly router = Router();

  constructor(
    private readonly service: LogoutService,
    private readonly authGuard: RequestHandler
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post("/", this.authGuard, asyncHandler(this.logout));
  }

  private logout = async (req: Request, res: Response): Promise<void> => {
    await this.service.logout(req);

    res.clearCookie(REFRESH_TOKEN, {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    new NoContentSuccess().send(req, res);
  };
}
