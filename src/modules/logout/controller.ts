import type { Response, Request } from "express";
import { OkSuccess } from "@/infra/responses/success";
import { asyncHandler } from "@/infra/utils/async-handler";
import { COOKIE_NAMES } from "@/infra/configs/cookie";
import { logoutService } from "@/modules/logout/service";

export const logoutController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { data, message } = await logoutService(req);

    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    new OkSuccess({ data, message }).send(req, res);
  }
);
