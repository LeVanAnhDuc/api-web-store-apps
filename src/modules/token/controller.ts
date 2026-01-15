import type { Response } from "express";
import type { RefreshTokenRequest } from "@/modules/token/types";
import { refreshAccessTokenService } from "@/modules/token/service";
import { OkSuccess } from "@/infra/responses/success";
import { asyncHandler } from "@/infra/utils/async-handler";

export const refreshTokenController = asyncHandler(
  async (req: RefreshTokenRequest, res: Response): Promise<void> => {
    const { data, message } = refreshAccessTokenService(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);
