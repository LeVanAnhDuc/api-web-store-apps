import type { Response, Request } from "express";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";
import { COOKIE_NAMES } from "@/constants/infrastructure";
import ENV from "@/configurations/env";
import { logoutService } from "@/modules/logout/logout.service";

class LogoutController {
  constructor(private readonly service: typeof logoutService) {}

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { data, message } = await this.service.logout(req);

    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    new OkSuccess({ data, message }).send(req, res);
  });
}

export const logoutController = new LogoutController(logoutService);
