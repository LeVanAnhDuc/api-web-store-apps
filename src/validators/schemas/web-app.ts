// libs
import Joi from "joi";
// types
import type { AdminAppsQuery } from "@/modules/web-app/types";
// modules
import { WEB_APP_STATUS_PUBLIC } from "@/modules/web-app/constants";

const STATUS_VALUES = Object.values(WEB_APP_STATUS_PUBLIC);
const OBJECTID_PATTERN = /^[a-fA-F0-9]{24}$/;

export const adminListAppsQuerySchema: Joi.ObjectSchema<AdminAppsQuery> =
  Joi.object({
    search: Joi.string().trim().optional(),

    status: Joi.string()
      .valid(...STATUS_VALUES)
      .optional()
      .messages({ "any.only": "validation:status.invalid" }),

    categoryId: Joi.string().pattern(OBJECTID_PATTERN).optional().messages({
      "string.pattern.base": "validation:categoryId.invalid"
    })
  }).options({ stripUnknown: true });
