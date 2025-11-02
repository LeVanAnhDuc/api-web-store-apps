// libs
import joi from "joi";
// schemas
import common from "./schemas/common.schema";

const { emailSchema, passwordSchema } = common;

const messages = {
  empty: "{{#label}} is not allowed to be empty",
  emailInvalid: "{{#label}} is invalid"
};

const baseEmailSchema = {
  email: emailSchema.required().messages({
    "string.empty": messages.empty,
    "string.email": messages.emailInvalid
  })
};

const basePasswordSchema = {
  password: passwordSchema.required().messages({
    "string.empty": messages.empty
  })
};

export const loginSchema = joi.object({
  ...baseEmailSchema,
  ...basePasswordSchema
});

export const signupSchema = joi.object({
  fullName: joi.string().required().messages({
    "string.empty": messages.empty
  }),
  phone: joi.string().required().messages({
    "string.empty": messages.empty
  }),
  ...baseEmailSchema,
  ...basePasswordSchema
});

export const signupVerifySchema = joi.object({
  ...baseEmailSchema,
  otpCode: joi.string().required().messages({
    "string.empty": messages.empty
  })
});

export const reSendOtpSchema = joi.object({
  ...baseEmailSchema
});

export const sendOtpForgotPassword = joi.object({
  ...baseEmailSchema
});

export const confirmOpForgotPasswordSchema = joi.object({
  otpCode: joi.string().required().messages({
    "string.empty": messages.empty
  })
});

export const updatePasswordForgotPasswordSchema = joi.object({
  ...basePasswordSchema
});
