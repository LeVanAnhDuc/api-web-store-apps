import type { Request, Response } from "express";
import { refreshAccessTokenService } from "@/modules/token/service";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { data, message } = refreshAccessTokenService(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);
