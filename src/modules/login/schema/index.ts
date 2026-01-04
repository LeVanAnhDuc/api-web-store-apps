import Joi from "joi";
import { emailSchema, otpSchema } from "@/shared/schemas";
import { MAGIC_LINK_CONFIG } from "@/shared/constants/modules/session";

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
  otp: otpSchema.required()
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
