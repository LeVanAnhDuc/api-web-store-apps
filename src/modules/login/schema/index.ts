// libs
import Joi from "joi";
// shared
import { emailSchema, passwordSchema } from "@/shared/schemas/auth.schema";

export const loginSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema
});
