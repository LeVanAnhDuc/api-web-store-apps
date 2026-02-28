import { Router } from "express";
import { loginController } from "@/modules/login/controller";
import { validate } from "@/validators/middleware";
import { getRateLimiterMiddleware } from "@/loaders/rate-limiter.loader";
import {
  loginSchema,
  otpSendSchema,
  otpVerifySchema,
  magicLinkSendSchema,
  magicLinkVerifySchema
} from "@/validators/schemas/login";

const loginRouter = Router();

loginRouter.post(
  "/",
  (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
  validate(loginSchema, "body"),
  loginController.login
);

loginRouter.post(
  "/otp/send",
  (req, res, next) => getRateLimiterMiddleware().loginOtpByIp(req, res, next),
  (req, res, next) =>
    getRateLimiterMiddleware().loginOtpByEmail(req, res, next),
  validate(otpSendSchema, "body"),
  loginController.sendOtp
);

loginRouter.post(
  "/otp/verify",
  (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
  validate(otpVerifySchema, "body"),
  loginController.verifyOtp
);

loginRouter.post(
  "/magic-link/send",
  (req, res, next) => getRateLimiterMiddleware().magicLinkByIp(req, res, next),
  (req, res, next) =>
    getRateLimiterMiddleware().magicLinkByEmail(req, res, next),
  validate(magicLinkSendSchema, "body"),
  loginController.sendMagicLink
);

loginRouter.post(
  "/magic-link/verify",
  (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
  validate(magicLinkVerifySchema, "body"),
  loginController.verifyMagicLink
);

export default loginRouter;
