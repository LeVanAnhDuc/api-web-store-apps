import { Router } from "express";
import type { Response, Request } from "express";
import type { LogoutService } from "./logout.service";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";
import { COOKIE_NAMES } from "@/constants/infrastructure";
import ENV from "@/configurations/env";
import { authenticate } from "@/middlewares/auth";

export class LogoutController {
  public readonly router = Router();

  constructor(private readonly service: LogoutService) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post("/", authenticate, asyncHandler(this.logout));
  }

  private logout = async (req: Request, res: Response): Promise<void> => {
    const { data, message } = await this.service.logout(req);

    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    new OkSuccess({ data, message }).send(req, res);
  };
}
