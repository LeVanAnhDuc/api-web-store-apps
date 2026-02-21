import Joi from "joi";
import { emailSchema } from "@/validators/schemas";

export const unlockRequestSchema = Joi.object({
  email: emailSchema.required()
});

export const unlockVerifySchema = Joi.object({
  email: emailSchema.required(),
  tempPassword: Joi.string().min(12).required().messages({
    "string.empty": "unlock-account:validation.tempPasswordRequired",
    "string.min": "unlock-account:validation.tempPasswordTooShort",
    "any.required": "unlock-account:validation.tempPasswordRequired"
  })
});
