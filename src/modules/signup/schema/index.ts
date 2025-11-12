import Joi from "joi";

export const sendOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "signup:errors.invalidEmailFormat",
    "string.empty": "signup:errors.emailRequired",
    "any.required": "signup:errors.emailRequired"
  })
});
