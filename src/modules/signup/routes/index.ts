import { Router } from "express";

import { sendOtpController } from "@/modules/signup/controller";
import { validate } from "@/shared/middlewares/validation";
import { sendOtpSchema } from "@/modules/signup/schema";

const signupRouter = Router();

signupRouter.post(
  "/send-otp",
  validate(sendOtpSchema, "body"),
  sendOtpController
);

export default signupRouter;
