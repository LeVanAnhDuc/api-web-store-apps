import type { Request, Response } from "express";
import { tokenService } from "@/modules/token/token.service";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";

class TokenController {
  constructor(private readonly service: typeof tokenService) {}

  refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { data, message } = this.service.refreshAccessToken(req);
      new OkSuccess({ data, message }).send(req, res);
    }
  );
}

export const tokenController = new TokenController(tokenService);
