import Joi from "joi";
import {
  GENDERS,
  FULLNAME_VALIDATION,
  SAFE_FULLNAME_PATTERN
} from "@/modules/user/constants";
import { getDateOfBirthBounds } from "@/app/utils/date";
import {
  EMAIL_VALIDATION,
  NUMERIC_OTP_PATTERN,
  OTP_VALIDATION,
  PASSWORD_STRENGTH_PATTERN,
  PASSWORD_VALIDATION,
  SAFE_EMAIL_PATTERN
} from "@/modules/authentication/constants";

const GENDER_VALUES = Object.values(GENDERS);

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

export const fullNameSchema = Joi.string()
  .min(FULLNAME_VALIDATION.MIN_LENGTH)
  .max(FULLNAME_VALIDATION.MAX_LENGTH)
  .pattern(SAFE_FULLNAME_PATTERN)
  .messages({
    "string.empty": "user:validation.fullNameRequired",
    "string.min": "user:validation.fullNameMinLength",
    "string.max": "user:validation.fullNameMaxLength",
    "string.pattern.base": "user:validation.fullNameInvalid",
    "any.required": "user:validation.fullNameRequired"
  });

export const genderSchema = Joi.string()
  .valid(...GENDER_VALUES)
  .messages({
    "string.empty": "user:validation.genderRequired",
    "any.required": "user:validation.genderRequired",
    "any.only": "user:validation.genderInvalid"
  });

export const dateOfBirthSchema = Joi.date()
  .min(getDateOfBirthBounds().minDate)
  .max(getDateOfBirthBounds().maxDate)
  .messages({
    "date.base": "user:validation.dateOfBirthInvalid",
    "date.min": "user:validation.dateOfBirthTooOld",
    "date.max": "user:validation.dateOfBirthTooYoung",
    "any.required": "user:validation.dateOfBirthRequired"
  });
