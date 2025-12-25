/**
 * Signup Validation Schemas
 * Joi schemas for signup endpoints
 * Validation layer - format checking happens here, NOT in service
 */

import Joi from "joi";

// constants
import {
  GENDERS,
  FULLNAME_VALIDATION,
  AGE_VALIDATION,
  SAFE_FULLNAME_PATTERN
} from "@/shared/constants/modules/user";
import { OTP_PATTERN, SESSION_CONFIG } from "@/shared/constants/modules/signup";

// schemas
import { emailSchema, passwordSchema } from "@/shared/schemas/auth.schema";

// types
import type {
  SendOtpBody,
  VerifyOtpBody,
  CompleteSignupBody,
  CheckEmailParams
} from "@/shared/types/modules/signup";

const GENDER_VALUES = Object.values(GENDERS);

/**
 * Calculate min/max date of birth based on age validation
 */
const getDateOfBirthBounds = (): { minDate: Date; maxDate: Date } => {
  const now = new Date();

  // Maximum date = today minus min age (must be at least MIN_AGE years old)
  const maxDate = new Date(now);
  maxDate.setFullYear(maxDate.getFullYear() - AGE_VALIDATION.MIN_AGE);

  // Minimum date = today minus max age (can't be older than MAX_AGE)
  const minDate = new Date(now);
  minDate.setFullYear(minDate.getFullYear() - AGE_VALIDATION.MAX_AGE);

  return { minDate, maxDate };
};

/**
 * POST /signup/send-otp
 */
export const sendOtpSchema: Joi.ObjectSchema<SendOtpBody> = Joi.object({
  email: emailSchema
});

/**
 * POST /signup/verify-otp
 */
export const verifyOtpSchema: Joi.ObjectSchema<VerifyOtpBody> = Joi.object({
  email: emailSchema,
  otp: Joi.string().pattern(OTP_PATTERN).required().messages({
    "string.empty": "signup:errors.otpRequired",
    "string.pattern.base": "signup:errors.otpInvalid",
    "any.required": "signup:errors.otpRequired"
  })
});

/**
 * POST /signup/complete
 */
export const completeSignupSchema: Joi.ObjectSchema<CompleteSignupBody> =
  Joi.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "string.empty": "signup:errors.confirmPasswordRequired",
        "any.required": "signup:errors.confirmPasswordRequired",
        "any.only": "signup:errors.passwordMismatch"
      }),
    sessionToken: Joi.string()
      .length(SESSION_CONFIG.TOKEN_LENGTH * 2) // hex string is 2x length
      .required()
      .messages({
        "string.empty": "signup:errors.sessionTokenRequired",
        "string.length": "signup:errors.sessionTokenInvalid",
        "any.required": "signup:errors.sessionTokenRequired"
      }),
    acceptTerms: Joi.boolean().strict().valid(true).required().messages({
      "boolean.base": "signup:errors.acceptTermsInvalid",
      "any.required": "signup:errors.acceptTermsRequired",
      "any.only": "signup:errors.acceptTermsRequired"
    }),
    fullName: Joi.string()
      .min(FULLNAME_VALIDATION.MIN_LENGTH)
      .max(FULLNAME_VALIDATION.MAX_LENGTH)
      .pattern(SAFE_FULLNAME_PATTERN)
      .required()
      .messages({
        "string.empty": "signup:errors.fullNameRequired",
        "string.min": "user:validation.fullNameMinLength",
        "string.max": "user:validation.fullNameMaxLength",
        "string.pattern.base": "user:validation.fullNameInvalid",
        "any.required": "signup:errors.fullNameRequired"
      }),
    gender: Joi.string()
      .valid(...GENDER_VALUES)
      .required()
      .messages({
        "string.empty": "signup:errors.genderRequired",
        "any.required": "signup:errors.genderRequired",
        "any.only": "user:validation.genderInvalid"
      }),
    dateOfBirth: Joi.date()
      .min(getDateOfBirthBounds().minDate)
      .max(getDateOfBirthBounds().maxDate)
      .required()
      .messages({
        "date.base": "signup:errors.dateOfBirthRequired",
        "date.min": "user:validation.dateOfBirthTooOld",
        "date.max": "user:validation.dateOfBirthTooYoung",
        "any.required": "signup:errors.dateOfBirthRequired"
      })
  });

/**
 * GET /signup/check-email/:email
 */
export const checkEmailSchema: Joi.ObjectSchema<CheckEmailParams> = Joi.object({
  email: emailSchema
});
