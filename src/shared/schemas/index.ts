import Joi from "joi";
import {
  EMAIL_VALIDATION,
  PASSWORD_VALIDATION,
  PASSWORD_PATTERN,
  SAFE_EMAIL_PATTERN
} from "@/shared/constants/modules/auth";

/**
 *  Validates:
 * - Email format (RFC 5322)
 */

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
