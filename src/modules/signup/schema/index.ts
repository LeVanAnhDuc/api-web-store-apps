// libs
import Joi from "joi";

export const sendOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "INVALID_EMAIL_FORMAT",
    "string.empty": "EMAIL_REQUIRED",
    "any.required": "EMAIL_REQUIRED"
  })
});
