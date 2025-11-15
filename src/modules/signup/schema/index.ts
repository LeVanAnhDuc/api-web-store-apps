import Joi from "joi";

import { PASSWORD_VALIDATION } from "@/shared/constants/auth";
import { GENDERS, FULLNAME_VALIDATION } from "@/shared/constants/user";
import type {
  SendOtpBody,
  VerifyOtpBody,
  CompleteSignupBody
} from "@/shared/types/modules/signup";

const GENDER_VALUES = Object.values(GENDERS);

export const sendOtpSchema: Joi.ObjectSchema<SendOtpBody> = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "signup:errors.invalidEmailFormat",
    "string.empty": "signup:errors.emailRequired",
    "any.required": "signup:errors.emailRequired"
  })
});

export const verifyOtpSchema: Joi.ObjectSchema<VerifyOtpBody> = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "signup:errors.invalidEmailFormat",
    "string.empty": "signup:errors.emailRequired",
    "any.required": "signup:errors.emailRequired"
  }),
  otp: Joi.string().required().messages({
    "string.empty": "signup:errors.otpRequired",
    "any.required": "signup:errors.otpRequired"
  })
});

export const completeSignupSchema: Joi.ObjectSchema<CompleteSignupBody> =
  Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "signup:errors.invalidEmailFormat",
      "string.empty": "signup:errors.emailRequired",
      "any.required": "signup:errors.emailRequired"
    }),
    password: Joi.string()
      .min(PASSWORD_VALIDATION.MIN_LENGTH)
      .required()
      .messages({
        "string.empty": "signup:errors.passwordRequired",
        "string.min": "auth:validation.passwordMinLength",
        "any.required": "signup:errors.passwordRequired"
      }),
    sessionId: Joi.string().required().messages({
      "string.empty": "signup:errors.sessionIdRequired",
      "any.required": "signup:errors.sessionIdRequired"
    }),
    acceptTerms: Joi.boolean().valid(true).required().messages({
      "any.required": "signup:errors.acceptTermsRequired",
      "any.only": "signup:errors.acceptTermsRequired"
    }),
    fullName: Joi.string()
      .min(FULLNAME_VALIDATION.MIN_LENGTH)
      .max(FULLNAME_VALIDATION.MAX_LENGTH)
      .required()
      .messages({
        "string.empty": "signup:errors.fullNameRequired",
        "string.min": "user:validation.fullNameMinLength",
        "string.max": "user:validation.fullNameMaxLength",
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
    birthday: Joi.date().max("now").required().messages({
      "date.base": "signup:errors.birthdayRequired",
      "date.max": "user:validation.birthdayInvalid",
      "any.required": "signup:errors.birthdayRequired"
    })
  });
