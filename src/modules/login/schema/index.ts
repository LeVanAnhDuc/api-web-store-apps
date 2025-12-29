/**
 * Login Validation Schemas
 * Joi schemas for all login endpoints
 *
 * Note: Session management schemas moved to logout module
 */

// libs
import Joi from "joi";
// shared
import { emailSchema } from "@/shared/schemas/auth.schema";
// constants
import {
  LOGIN_OTP_CONFIG,
  MAGIC_LINK_CONFIG
} from "@/shared/constants/modules/session";

// =============================================================================
// Password Login
// =============================================================================

/**
 * Password login schema
 * Validates email and password for traditional login
 */
export const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required().messages({
    "string.empty": "auth:validation.passwordRequired",
    "any.required": "auth:validation.passwordRequired"
  })
});

// =============================================================================
// OTP Login
// =============================================================================

/**
 * OTP send schema
 * Validates email for OTP request
 */
export const otpSendSchema = Joi.object({
  email: emailSchema
});

/**
 * OTP verify schema
 * Validates email and OTP code
 */
export const otpVerifySchema = Joi.object({
  email: emailSchema,
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

// =============================================================================
// Magic Link Login
// =============================================================================

/**
 * Magic link send schema
 * Validates email for magic link request
 */
export const magicLinkSendSchema = Joi.object({
  email: emailSchema
});

/**
 * Magic link verify schema
 * Validates email and token
 */
export const magicLinkVerifySchema = Joi.object({
  email: emailSchema,
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
