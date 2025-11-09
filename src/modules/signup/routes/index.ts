// libs
import { Router } from "express";
// controllers
import { sendOtpController } from "@/modules/signup/controller";
// middlewares
import { validate } from "@/shared/middlewares/validation";
// schemas
import { sendOtpSchema } from "@/modules/signup/schema";

const signupRouter = Router();

signupRouter.post(
  "/send-otp",
  validate(sendOtpSchema, "SIGNUP.ERRORS", "body"),
  sendOtpController
);

export default signupRouter;
