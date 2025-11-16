import Joi from "joi";
import { EMAIL_VALIDATION } from "@/shared/constants/auth";

// Regex to block dangerous Unicode characters in email
// Blocks: control chars, RTL/LTR overrides, zero-width chars, null bytes, etc.

const SAFE_EMAIL_PATTERN =
  // eslint-disable-next-line no-control-regex
  /^[^\u0000-\u001F\u007F-\u009F\u200B-\u200D\u202A-\u202E\uFEFF]+$/;

/**
 * Common email validation schema
 * Can be reused across multiple modules and endpoints
 *
 * Validates:
 * - Email format (RFC 5322)
 * - Length: 3-254 characters (RFC 5321)
 * - Blocks dangerous Unicode characters (control chars, RTL/LTR overrides, zero-width chars)
 *
 * @example
 * ```typescript
 * import { emailSchema } from "@/shared/schemas/auth.schema";
 *
 * const mySchema = Joi.object({
 *   email: emailSchema
 * });
 * ```
 */
export const emailSchema = Joi.string()
  .email()
  .min(EMAIL_VALIDATION.MIN_LENGTH)
  .max(EMAIL_VALIDATION.MAX_LENGTH)
  .pattern(SAFE_EMAIL_PATTERN)
  .required()
  .messages({
    "string.email": "auth:validation.emailInvalid",
    "string.empty": "auth:validation.emailRequired",
    "string.min": "auth:validation.emailMinLength",
    "string.max": "auth:validation.emailMaxLength",
    "string.pattern.base": "auth:validation.emailInvalid",
    "any.required": "auth:validation.emailRequired"
  });

/**
 * Optional email schema (not required)
 * Same validation as emailSchema but field is optional
 */
export const optionalEmailSchema = emailSchema.optional().messages({
  "string.email": "auth:validation.emailInvalid",
  "string.min": "auth:validation.emailMinLength",
  "string.max": "auth:validation.emailMaxLength",
  "string.pattern.base": "auth:validation.emailInvalid"
});
