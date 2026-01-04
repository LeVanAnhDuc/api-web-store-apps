import { Router } from "express";
import {
  loginController,
  sendOtpController,
  verifyOtpController,
  sendMagicLinkController,
  verifyMagicLinkController
} from "@/modules/login/controller";
import { validate } from "@/shared/middlewares/validation";
import { getRateLimiterMiddleware } from "@/loaders/rate-limiter.loader";
import {
  loginSchema,
  otpSendSchema,
  otpVerifySchema,
  magicLinkSendSchema,
  magicLinkVerifySchema
} from "@/modules/login/schema";

const loginRouter = Router();

loginRouter.post(
  "/",
  (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
  validate(loginSchema, "body"),
  loginController
);

loginRouter.post(
  "/otp/send",
  (req, res, next) => getRateLimiterMiddleware().loginOtpByIp(req, res, next),
  (req, res, next) =>
    getRateLimiterMiddleware().loginOtpByEmail(req, res, next),
  validate(otpSendSchema, "body"),
  sendOtpController
);

loginRouter.post(
  "/otp/verify",
  (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
  validate(otpVerifySchema, "body"),
  verifyOtpController
);

loginRouter.post(
  "/magic-link/send",
  (req, res, next) => getRateLimiterMiddleware().magicLinkByIp(req, res, next),
  (req, res, next) =>
    getRateLimiterMiddleware().magicLinkByEmail(req, res, next),
  validate(magicLinkSendSchema, "body"),
  sendMagicLinkController
);

loginRouter.post(
  "/magic-link/verify",
  (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
  validate(magicLinkVerifySchema, "body"),
  verifyMagicLinkController
);

export default loginRouter;
