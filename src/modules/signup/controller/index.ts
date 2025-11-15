// libs
import type { Response } from "express";
// types
import type {
  SendOtpRequest,
  VerifyOtpRequest,
  CompleteSignupRequest
} from "@/shared/types/modules/signup";
// services
import { completeSignup, sendOtp, verifyOtp } from "@/modules/signup/service";
// responses
import { OkSuccess } from "@/core/responses/success";
// utils
import { asyncHandler } from "@/core/utils/async-handler";

export const sendOtpController = asyncHandler(
  async (req: SendOtpRequest, res: Response): Promise<void> => {
    const { data, message } = await sendOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const verifyOtpController = asyncHandler(
  async (req: VerifyOtpRequest, res: Response): Promise<void> => {
    const { data, message } = await verifyOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const completeSignupController = asyncHandler(
  async (req: CompleteSignupRequest, res: Response): Promise<void> => {
    const { data, message } = await completeSignup(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);
