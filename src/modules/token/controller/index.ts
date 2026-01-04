import type { Response } from "express";
import type { RefreshTokenRequest } from "@/shared/types/modules/token";
import { refreshAccessTokenService } from "@/modules/token/service";
import { OkSuccess } from "@/core/responses/success";
import { asyncHandler } from "@/core/utils/async-handler";

export const refreshTokenController = asyncHandler(
  async (req: RefreshTokenRequest, res: Response): Promise<void> => {
    const { data, message } = refreshAccessTokenService(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);
