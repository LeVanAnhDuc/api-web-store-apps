import Joi from "joi";
import { CONTACT_CATEGORIES, CONTACT_PRIORITIES } from "@/constants/enums";
import { CONTACT_CONFIG } from "@/constants/config";
import { emailSchema } from "./base";
import type { SubmitContactBody } from "@/types/modules/contact-admin";

const CATEGORY_VALUES = Object.values(CONTACT_CATEGORIES);
const PRIORITY_VALUES = Object.values(CONTACT_PRIORITIES);

export const submitContactSchema: Joi.ObjectSchema<SubmitContactBody> =
  Joi.object({
    email: emailSchema.optional().allow("").messages({
      "string.email": "validation:email.invalid",
      "string.pattern.base": "validation:email.invalid"
    }),
    subject: Joi.string()
      .min(CONTACT_CONFIG.SUBJECT_MIN_LENGTH)
      .max(CONTACT_CONFIG.SUBJECT_MAX_LENGTH)
      .required()
      .messages({
        "string.empty": "contactAdmin:errors.subjectRequired",
        "string.min": "contactAdmin:errors.subjectTooShort",
        "string.max": "contactAdmin:errors.subjectTooLong",
        "any.required": "contactAdmin:errors.subjectRequired"
      }),
    category: Joi.string()
      .valid(...CATEGORY_VALUES)
      .required()
      .messages({
        "string.empty": "contactAdmin:errors.categoryRequired",
        "any.required": "contactAdmin:errors.categoryRequired",
        "any.only": "contactAdmin:errors.categoryInvalid"
      }),
    priority: Joi.string()
      .valid(...PRIORITY_VALUES)
      .default(CONTACT_PRIORITIES.MEDIUM)
      .messages({
        "any.only": "contactAdmin:errors.priorityInvalid"
      }),
    message: Joi.string()
      .min(CONTACT_CONFIG.MESSAGE_MIN_LENGTH)
      .max(CONTACT_CONFIG.MESSAGE_MAX_LENGTH)
      .required()
      .messages({
        "string.empty": "contactAdmin:errors.messageRequired",
        "string.min": "contactAdmin:errors.messageTooShort",
        "string.max": "contactAdmin:errors.messageTooLong",
        "any.required": "contactAdmin:errors.messageRequired"
      })
  });
