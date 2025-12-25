/**
 * Signup Controller
 * Handles HTTP request/response for signup endpoints
 * Delegates business logic to service layer
 */

// libs
import type { Response } from "express";

// types
import type {
  SendOtpRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  CompleteSignupRequest,
  CheckEmailRequest
} from "@/shared/types/modules/signup";

// services
import {
  sendOtp,
  verifyOtp,
  resendOtp,
  completeSignup,
  checkEmail
} from "@/modules/signup/service";

// responses
import { OkSuccess } from "@/core/responses/success";

// utils
import { asyncHandler } from "@/core/utils/async-handler";

/**
 * POST /signup/send-otp
 * Send OTP to email for verification
 */
export const sendOtpController = asyncHandler(
  async (req: SendOtpRequest, res: Response): Promise<void> => {
    const { data, message } = await sendOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

/**
 * POST /signup/verify-otp
 * Verify OTP code submitted by user
 */
export const verifyOtpController = asyncHandler(
  async (req: VerifyOtpRequest, res: Response): Promise<void> => {
    const { data, message } = await verifyOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

/**
 * POST /signup/resend-otp
 * Resend OTP to email (tracks resend count)
 */
export const resendOtpController = asyncHandler(
  async (req: ResendOtpRequest, res: Response): Promise<void> => {
    const { data, message } = await resendOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

/**
 * POST /signup/complete
 * Complete signup with user profile data
 */
export const completeSignupController = asyncHandler(
  async (req: CompleteSignupRequest, res: Response): Promise<void> => {
    const { data, message } = await completeSignup(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

/**
 * GET /signup/check-email/:email
 * Check if email is available for registration
 */
export const checkEmailController = asyncHandler(
  async (req: CheckEmailRequest, res: Response): Promise<void> => {
    const { data } = await checkEmail(req);
    new OkSuccess({ data }).send(req, res);
  }
);
