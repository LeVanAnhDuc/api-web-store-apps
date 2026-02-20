import type { Response } from "express";
import type {
  SendOtpRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  CompleteSignupRequest,
  CheckEmailRequest
} from "@/modules/signup/types";
import {
  sendOtpService,
  verifyOtpService,
  resendOtpService,
  completeSignupService,
  checkEmailService
} from "@/modules/signup/service";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";

export const sendOtpController = asyncHandler(
  async (req: SendOtpRequest, res: Response): Promise<void> => {
    const { data, message } = await sendOtpService(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const verifyOtpController = asyncHandler(
  async (req: VerifyOtpRequest, res: Response): Promise<void> => {
    const { data, message } = await verifyOtpService(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const resendOtpController = asyncHandler(
  async (req: ResendOtpRequest, res: Response): Promise<void> => {
    const { data, message } = await resendOtpService(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const completeSignupController = asyncHandler(
  async (req: CompleteSignupRequest, res: Response): Promise<void> => {
    const { data, message } = await completeSignupService(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const checkEmailController = asyncHandler(
  async (req: CheckEmailRequest, res: Response): Promise<void> => {
    const { data } = await checkEmailService(req);
    new OkSuccess({ data }).send(req, res);
  }
);
