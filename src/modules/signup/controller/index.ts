// libs
import type { Request, Response } from "express";
// services
import { sendOtp } from "@/modules/signup/service";
// responses
import { OkSuccess } from "@/core/responses/success";
// utils
import { asyncHandler } from "@/core/utils/async-handler";

export const sendOtpController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { data, message } = await sendOtp(req);
    new OkSuccess({ data, message }).send(res);
  }
);
