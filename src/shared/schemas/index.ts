import Joi from "joi";
import {
  EMAIL_VALIDATION,
  PASSWORD_VALIDATION,
  PASSWORD_PATTERN,
  SAFE_EMAIL_PATTERN,
  OTP_VALIDATION,
  OTP_PATTERN
} from "@/shared/constants/modules/auth";

export const emailSchema = Joi.string()
  .email()
  .min(EMAIL_VALIDATION.MIN_LENGTH)
  .max(EMAIL_VALIDATION.MAX_LENGTH)
  .pattern(SAFE_EMAIL_PATTERN)
  .messages({
    "string.email": "auth:validation.emailInvalid",
    "string.empty": "auth:validation.emailRequired",
    "string.min": "auth:validation.emailMinLength",
    "string.max": "auth:validation.emailMaxLength",
    "string.pattern.base": "auth:validation.emailInvalid",
    "any.required": "auth:validation.emailRequired"
  });

export const passwordSchema = Joi.string()
  .min(PASSWORD_VALIDATION.MIN_LENGTH)
  .max(PASSWORD_VALIDATION.MAX_LENGTH)
  .pattern(PASSWORD_PATTERN)
  .messages({
    "string.empty": "auth:validation.passwordRequired",
    "string.min": "auth:validation.passwordMinLength",
    "string.max": "auth:validation.passwordMaxLength",
    "string.pattern.base": "auth:validation.passwordPattern",
    "any.required": "auth:validation.passwordRequired"
  });

export const otpSchema = Joi.string()
  .length(OTP_VALIDATION.LENGTH)
  .pattern(OTP_PATTERN)
  .messages({
    "string.empty": "auth:validation.otpRequired",
    "string.length": "auth:validation.otpLength",
    "string.pattern.base": "auth:validation.otpDigitsOnly",
    "any.required": "auth:validation.otpRequired"
  });
