import Joi from "joi";
import { emailSchema } from "@/shared/schemas";
import {
  LOGIN_OTP_CONFIG,
  MAGIC_LINK_CONFIG
} from "@/shared/constants/modules/session";

export const loginSchema = Joi.object({
  email: emailSchema.required(),
  password: Joi.string().required().messages({
    "string.empty": "auth:validation.passwordRequired",
    "any.required": "auth:validation.passwordRequired"
  })
});

export const otpSendSchema = Joi.object({
  email: emailSchema.required()
});

export const otpVerifySchema = Joi.object({
  email: emailSchema.required(),
  otp: Joi.string()
    .length(LOGIN_OTP_CONFIG.LENGTH)
    .pattern(/^\d+$/)
    .required()
    .messages({
      "string.empty": "login:validation.otpRequired",
      "string.length": "login:validation.otpLength",
      "string.pattern.base": "login:validation.otpDigitsOnly",
      "any.required": "login:validation.otpRequired"
    })
});

export const magicLinkSendSchema = Joi.object({
  email: emailSchema.required()
});

export const magicLinkVerifySchema = Joi.object({
  email: emailSchema.required(),
  token: Joi.string()
    .length(MAGIC_LINK_CONFIG.TOKEN_LENGTH)
    .pattern(/^[a-f0-9]+$/)
    .required()
    .messages({
      "string.empty": "login:validation.tokenRequired",
      "string.length": "login:validation.tokenInvalid",
      "string.pattern.base": "login:validation.tokenInvalid",
      "any.required": "login:validation.tokenRequired"
    })
});
