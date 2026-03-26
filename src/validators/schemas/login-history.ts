import Joi from "joi";
import {
  LOGIN_STATUSES,
  LOGIN_METHODS,
  DEVICE_TYPES,
  CLIENT_TYPES
} from "@/constants/modules/login-history";

const STATUS_VALUES = Object.values(LOGIN_STATUSES);
const METHOD_VALUES = Object.values(LOGIN_METHODS);
const DEVICE_TYPE_VALUES = Object.values(DEVICE_TYPES);
const CLIENT_TYPE_VALUES = Object.values(CLIENT_TYPES);

const SORT_BY_USER_VALUES = [
  "createdAt",
  "method",
  "status",
  "country"
] as const;
const SORT_BY_ADMIN_VALUES = [
  "createdAt",
  "method",
  "status",
  "country",
  "ip",
  "usernameAttempted"
] as const;
const SORT_ORDER_VALUES = ["asc", "desc"] as const;

const OBJECTID_PATTERN = /^[a-fA-F0-9]{24}$/;
const LIMIT_MAX = 100;

export const loginHistoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    "number.base": "validation:page.invalid",
    "number.integer": "validation:page.invalid",
    "number.min": "validation:page.invalid"
  }),

  limit: Joi.number().integer().min(1).max(LIMIT_MAX).optional().messages({
    "number.base": "validation:limit.invalid",
    "number.integer": "validation:limit.invalid",
    "number.min": "validation:limit.invalid",
    "number.max": "validation:limit.invalid"
  }),

  status: Joi.string()
    .valid(...STATUS_VALUES)
    .optional()
    .messages({
      "any.only": "validation:status.invalid"
    }),

  method: Joi.string()
    .valid(...METHOD_VALUES)
    .optional()
    .messages({
      "any.only": "validation:method.invalid"
    }),

  deviceType: Joi.string()
    .valid(...DEVICE_TYPE_VALUES)
    .optional()
    .messages({
      "any.only": "validation:deviceType.invalid"
    }),

  clientType: Joi.string()
    .valid(...CLIENT_TYPE_VALUES)
    .optional()
    .messages({
      "any.only": "validation:clientType.invalid"
    }),

  country: Joi.string().trim().optional(),

  city: Joi.string().trim().optional(),

  os: Joi.string().trim().optional(),

  browser: Joi.string().trim().optional(),

  fromDate: Joi.string().isoDate().optional().messages({
    "string.isoDate": "validation:fromDate.invalid"
  }),

  toDate: Joi.string().isoDate().optional().messages({
    "string.isoDate": "validation:toDate.invalid"
  }),

  sortBy: Joi.string()
    .valid(...SORT_BY_USER_VALUES)
    .optional()
    .messages({
      "any.only": "validation:sortBy.invalid"
    }),

  sortOrder: Joi.string()
    .valid(...SORT_ORDER_VALUES)
    .optional()
    .messages({
      "any.only": "validation:sortOrder.invalid"
    })
})
  .custom((value, helpers) => {
    const { fromDate, toDate } = value;
    if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) {
      return helpers.error("date.range");
    }
    return value;
  })
  .messages({
    "date.range": "validation:dateRange.invalid"
  })
  .options({ stripUnknown: true });

export const loginHistoryAdminQuerySchema = loginHistoryQuerySchema
  .keys({
    userId: Joi.string().pattern(OBJECTID_PATTERN).optional().messages({
      "string.pattern.base": "validation:userId.invalid"
    }),

    ip: Joi.string().trim().optional(),

    sortBy: Joi.string()
      .valid(...SORT_BY_ADMIN_VALUES)
      .optional()
      .messages({
        "any.only": "validation:sortBy.invalid"
      })
  })
  .options({ stripUnknown: true });
