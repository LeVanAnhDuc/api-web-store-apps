// libs
import joi from "joi";
// schemas
import common from "@/schema/common.schema";

const { emailSchema, passwordSchema } = common;

const messages = {
  empty: "{{#label}} is not allowed to be empty",
  emailInvalid: "{{#label}} is invalid"
};

const baseUserSchema = {
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
  ...baseUserSchema,
  ...basePasswordSchema
});

export const signupSchema = joi.object({
  fullName: joi.string().required().messages({
    "string.empty": messages.empty
  }),
  phone: joi.string().required().messages({
    "string.empty": messages.empty
  }),
  ...baseUserSchema,
  ...basePasswordSchema
});

export const signupVerifySchema = joi.object({
  ...baseUserSchema,
  otpCode: joi.string().required().messages({
    "string.empty": messages.empty
  })
});

export const reSendOtpSchema = joi.object({
  ...baseUserSchema
});

export const sendOtpForgotPassword = joi.object({
  ...baseUserSchema
});

export const confirmOpForgotPasswordSchema = joi.object({
  otpCode: joi.string().required().messages({
    "string.empty": messages.empty
  })
});

export const updatePasswordForgotPasswordSchema = joi.object({
  ...basePasswordSchema
});
