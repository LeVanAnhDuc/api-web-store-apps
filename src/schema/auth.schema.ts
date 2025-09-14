// libs
import joi from 'joi';
// schemas
import common from './common.schema';

const { emailSchema, passwordSchema } = common;

const MESSAGE_EMPTY = '{{#label}} is not allowed to be empty';
const MESSAGE_EMAIL_INVALID = '{{#label}} is invalid';

export const loginSchema = joi.object({
  email: emailSchema.required().messages({
    'string.empty': MESSAGE_EMPTY,
    'string.email': MESSAGE_EMAIL_INVALID
  }),
  password: joi.string().required().messages({
    'string.empty': MESSAGE_EMPTY
  })
});

export const signupSchema = joi.object({
  fullName: joi.string().required().messages({
    'string.empty': MESSAGE_EMPTY
  }),
  email: emailSchema.required().messages({
    'string.empty': MESSAGE_EMPTY,
    'string.email': MESSAGE_EMAIL_INVALID
  }),
  phone: joi.string().required().messages({
    'string.empty': MESSAGE_EMPTY
  }),
  password: passwordSchema.required().messages({
    'string.empty': MESSAGE_EMPTY
  })
});

export const signupVerifySchema = joi.object({
  email: emailSchema.required().messages({
    'string.empty': MESSAGE_EMPTY,
    'string.email': MESSAGE_EMAIL_INVALID
  }),
  otpCode: joi.string().required().messages({
    'string.empty': MESSAGE_EMPTY
  })
});

export const reSendOtpSchema = joi.object({
  email: emailSchema.required().messages({
    'string.empty': MESSAGE_EMPTY,
    'string.email': MESSAGE_EMAIL_INVALID
  })
});

export const sendOtpForgotPassword = joi.object({
  email: emailSchema.required().messages({
    'string.empty': MESSAGE_EMPTY,
    'string.email': MESSAGE_EMAIL_INVALID
  })
});

export const confirmOpForgotPasswordSchema = joi.object({
  otpCode: joi.string().required().messages({
    'string.empty': MESSAGE_EMPTY
  })
});

export const updatePasswordForgotPasswordSchema = joi.object({
  password: passwordSchema.required().messages({
    'string.empty': MESSAGE_EMPTY
  })
});
