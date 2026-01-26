import Joi from "joi";
import {
  EMAIL_VALIDATION,
  PASSWORD_VALIDATION,
  PASSWORD_STRENGTH_PATTERN,
  SAFE_EMAIL_PATTERN,
  OTP_VALIDATION,
  NUMERIC_OTP_PATTERN
} from "@/modules/authentication/constants";

export const emailSchema = Joi.string()
  .email()
  .min(EMAIL_VALIDATION.MIN_LENGTH)
  .max(EMAIL_VALIDATION.MAX_LENGTH)
  .pattern(SAFE_EMAIL_PATTERN)
  .messages({
    "string.email": "authentication:validation.emailInvalid",
    "string.empty": "authentication:validation.emailRequired",
    "string.min": "authentication:validation.emailMinLength",
    "string.max": "authentication:validation.emailMaxLength",
    "string.pattern.base": "authentication:validation.emailInvalid",
    "any.required": "authentication:validation.emailRequired"
  });

export const passwordSchema = Joi.string()
  .min(PASSWORD_VALIDATION.MIN_LENGTH)
  .max(PASSWORD_VALIDATION.MAX_LENGTH)
  .pattern(PASSWORD_STRENGTH_PATTERN)
  .messages({
    "string.empty": "authentication:validation.passwordRequired",
    "string.min": "authentication:validation.passwordMinLength",
    "string.max": "authentication:validation.passwordMaxLength",
    "string.pattern.base": "authentication:validation.passwordPattern",
    "any.required": "authentication:validation.passwordRequired"
  });

export const otpSchema = Joi.string()
  .length(OTP_VALIDATION.LENGTH)
  .pattern(NUMERIC_OTP_PATTERN)
  .messages({
    "string.empty": "authentication:validation.otpRequired",
    "string.length": "authentication:validation.otpLength",
    "string.pattern.base": "authentication:validation.otpDigitsOnly",
    "any.required": "authentication:validation.otpRequired"
  });
