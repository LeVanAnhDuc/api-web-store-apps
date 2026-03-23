import Joi from "joi";
import { GENDERS } from "@/constants/enums";
import {
  FULLNAME_VALIDATION,
  SAFE_FULLNAME_PATTERN,
  SAFE_ADDRESS_PATTERN
} from "@/validators/constants";
import type { UpdateProfileData } from "@/types/modules/user";

const GENDER_VALUES = Object.values(GENDERS);
const ADDRESS_MAX_LENGTH = 500;

export const updateProfileSchema: Joi.ObjectSchema<UpdateProfileData> =
  Joi.object({
    fullName: Joi.string()
      .min(FULLNAME_VALIDATION.MIN_LENGTH)
      .max(FULLNAME_VALIDATION.MAX_LENGTH)
      .pattern(SAFE_FULLNAME_PATTERN)
      .optional()
      .messages({
        "string.empty": "validation:fullName.required",
        "string.min": "validation:fullName.minLength",
        "string.max": "validation:fullName.maxLength",
        "string.pattern.base": "validation:fullName.invalid"
      }),

    phone: Joi.string()
      .min(1)
      .max(20)
      .pattern(/^[\d\s()+-]+$/)
      .optional()
      .messages({
        "string.empty": "validation:phone.invalid",
        "string.max": "validation:phone.invalid",
        "string.pattern.base": "validation:phone.invalid"
      }),

    address: Joi.string()
      .max(ADDRESS_MAX_LENGTH)
      .pattern(SAFE_ADDRESS_PATTERN)
      .optional()
      .messages({
        "string.max": "validation:address.tooLong",
        "string.pattern.base": "validation:address.invalid"
      }),

    dateOfBirth: Joi.string()
      .isoDate()
      .custom((value, helpers) => {
        const date = new Date(value);
        const now = new Date();
        const hundredYearsAgo = new Date();
        hundredYearsAgo.setFullYear(now.getFullYear() - 100);

        if (date > now) {
          return helpers.error("date.future");
        }
        if (date < hundredYearsAgo) {
          return helpers.error("date.tooOld");
        }

        return value;
      })
      .optional()
      .messages({
        "string.isoDate": "validation:dateOfBirth.invalid",
        "date.future": "validation:dateOfBirth.tooYoung",
        "date.tooOld": "validation:dateOfBirth.tooOld"
      }),

    gender: Joi.string()
      .valid(...GENDER_VALUES)
      .optional()
      .messages({
        "any.only": "validation:gender.invalid"
      })
  }).options({ stripUnknown: true });

export const getPublicProfileSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required()
    .messages({
      "string.empty": "user:errors.invalidId",
      "string.pattern.base": "user:errors.invalidId",
      "any.required": "user:errors.invalidId"
    })
});
