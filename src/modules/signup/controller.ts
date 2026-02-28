import type { Response } from "express";
import type {
  SendOtpRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  CompleteSignupRequest,
  CheckEmailRequest
} from "@/types/modules/signup";
import { signupService } from "@/modules/signup/service/signup.service";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";

export const sendOtpController = asyncHandler(
  async (req: SendOtpRequest, res: Response): Promise<void> => {
    const { data, message } = await signupService.sendOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const verifyOtpController = asyncHandler(
  async (req: VerifyOtpRequest, res: Response): Promise<void> => {
    const { data, message } = await signupService.verifyOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const resendOtpController = asyncHandler(
  async (req: ResendOtpRequest, res: Response): Promise<void> => {
    const { data, message } = await signupService.resendOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const completeSignupController = asyncHandler(
  async (req: CompleteSignupRequest, res: Response): Promise<void> => {
    const { data, message } = await signupService.completeSignup(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const checkEmailController = asyncHandler(
  async (req: CheckEmailRequest, res: Response): Promise<void> => {
    const { data } = await signupService.checkEmail(req);
    new OkSuccess({ data }).send(req, res);
  }
);
