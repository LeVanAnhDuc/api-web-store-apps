import type { Request, Response } from "express";
import { tokenService } from "@/modules/token/token.service";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { data, message } = tokenService.refreshAccessToken(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);
