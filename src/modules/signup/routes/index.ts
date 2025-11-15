import { Router } from "express";
import {
  sendOtpController,
  verifyOtpController,
  completeSignupController
} from "@/modules/signup/controller";
import { validate } from "@/shared/middlewares/validation";
import {
  completeSignupSchema,
  sendOtpSchema,
  verifyOtpSchema
} from "@/modules/signup/schema";

const signupRouter = Router();

signupRouter.post(
  "/send-otp",
  validate(sendOtpSchema, "body"),
  sendOtpController
);

signupRouter.post(
  "/verify-otp",
  validate(verifyOtpSchema, "body"),
  verifyOtpController
);

signupRouter.post(
  "/resend-otp",
  validate(sendOtpSchema, "body"),
  sendOtpController
);

signupRouter.post(
  "/complete",
  validate(completeSignupSchema, "body"),
  completeSignupController
);

export default signupRouter;
