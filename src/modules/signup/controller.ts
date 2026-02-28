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

class SignupController {
  constructor(private readonly service: typeof signupService) {}

  sendOtp = asyncHandler(
    async (req: SendOtpRequest, res: Response): Promise<void> => {
      const { data, message } = await this.service.sendOtp(req);
      new OkSuccess({ data, message }).send(req, res);
    }
  );

  verifyOtp = asyncHandler(
    async (req: VerifyOtpRequest, res: Response): Promise<void> => {
      const { data, message } = await this.service.verifyOtp(req);
      new OkSuccess({ data, message }).send(req, res);
    }
  );

  resendOtp = asyncHandler(
    async (req: ResendOtpRequest, res: Response): Promise<void> => {
      const { data, message } = await this.service.resendOtp(req);
      new OkSuccess({ data, message }).send(req, res);
    }
  );

  completeSignup = asyncHandler(
    async (req: CompleteSignupRequest, res: Response): Promise<void> => {
      const { data, message } = await this.service.completeSignup(req);
      new OkSuccess({ data, message }).send(req, res);
    }
  );

  checkEmail = asyncHandler(
    async (req: CheckEmailRequest, res: Response): Promise<void> => {
      const { data } = await this.service.checkEmail(req);
      new OkSuccess({ data }).send(req, res);
    }
  );
}

export const signupController = new SignupController(signupService);
