import joi from "joi";

const emailSchema = joi.string().email();
const passwordSchema = joi
  .string()
  .regex(
    /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[@#$%^&+=!]).{8,}$/,
    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
  );

const commonSchema = {
  emailSchema,
  passwordSchema
};

export default commonSchema;
