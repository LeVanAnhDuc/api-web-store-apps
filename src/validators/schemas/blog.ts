import Joi from "joi";
import { BLOG_VISIBILITY } from "@/constants/modules/blog";

const OBJECTID_PATTERN = /^[a-fA-F0-9]{24}$/;
const VISIBILITY_VALUES = Object.values(BLOG_VISIBILITY);
const SORT_ORDER_VALUES = ["asc", "desc"] as const;
const SORT_BY_VALUES = ["title", "createdAt"] as const;

const objectIdSchema = Joi.string()
  .pattern(OBJECTID_PATTERN)
  .messages({ "string.pattern.base": "validation:objectId.invalid" });

export const createBlogSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().trim().messages({
    "string.empty": "blog:errors.titleRequired",
    "string.min": "blog:errors.titleTooShort",
    "string.max": "blog:errors.titleTooLong",
    "any.required": "blog:errors.titleRequired"
  }),
  content: Joi.string().min(1).required().messages({
    "string.empty": "blog:errors.contentRequired",
    "any.required": "blog:errors.contentRequired"
  }),
  visibility: Joi.string()
    .valid(...VISIBILITY_VALUES)
    .default(BLOG_VISIBILITY.PUBLIC)
    .messages({ "any.only": "blog:errors.visibilityInvalid" }),
  tags: Joi.array().items(objectIdSchema).max(10).optional().messages({
    "array.max": "blog:errors.tooManyTags"
  }),
  categories: Joi.array()
    .items(objectIdSchema)
    .max(5)
    .optional()
    .messages({ "array.max": "blog:errors.tooManyCategories" }),
  coverUrl: Joi.string().uri().optional().messages({
    "string.uri": "blog:errors.coverUrlInvalid"
  })
}).options({ stripUnknown: true });

export const updateBlogSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional().trim().messages({
    "string.empty": "blog:errors.titleRequired",
    "string.min": "blog:errors.titleTooShort",
    "string.max": "blog:errors.titleTooLong"
  }),
  content: Joi.string().min(1).optional().messages({
    "string.empty": "blog:errors.contentRequired"
  }),
  visibility: Joi.string()
    .valid(...VISIBILITY_VALUES)
    .optional()
    .messages({ "any.only": "blog:errors.visibilityInvalid" }),
  tags: Joi.array().items(objectIdSchema).max(10).optional().messages({
    "array.max": "blog:errors.tooManyTags"
  }),
  categories: Joi.array()
    .items(objectIdSchema)
    .max(5)
    .optional()
    .messages({ "array.max": "blog:errors.tooManyCategories" }),
  coverUrl: Joi.string().uri().optional().messages({
    "string.uri": "blog:errors.coverUrlInvalid"
  }),
  removeCover: Joi.boolean().optional()
}).options({ stripUnknown: true });

export const listBlogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "validation:page.invalid",
    "number.integer": "validation:page.invalid",
    "number.min": "validation:page.invalid"
  }),
  limit: Joi.number().integer().min(1).max(50).default(20).messages({
    "number.base": "validation:limit.invalid",
    "number.integer": "validation:limit.invalid",
    "number.min": "validation:limit.invalid",
    "number.max": "validation:limit.invalid"
  }),
  search: Joi.string().trim().max(100).optional().messages({
    "string.max": "validation:search.tooLong"
  }),
  categoryId: objectIdSchema.optional(),
  tagId: objectIdSchema.optional(),
  authorId: objectIdSchema.optional(),
  visibility: Joi.string()
    .valid(...VISIBILITY_VALUES)
    .optional()
    .messages({ "any.only": "validation:visibility.invalid" }),
  sortBy: Joi.string()
    .valid(...SORT_BY_VALUES)
    .default("createdAt")
    .messages({ "any.only": "validation:sortBy.invalid" }),
  sortOrder: Joi.string()
    .valid(...SORT_ORDER_VALUES)
    .default("desc")
    .messages({ "any.only": "validation:sortOrder.invalid" })
}).options({ stripUnknown: true });

export const tagQuerySchema = Joi.object({
  search: Joi.string().trim().max(50).optional(),
  limit: Joi.number().integer().min(1).max(50).default(10).messages({
    "number.base": "validation:limit.invalid",
    "number.max": "validation:limit.invalid"
  })
}).options({ stripUnknown: true });

export const createTagSchema = Joi.object({
  name: Joi.string().min(1).max(50).required().messages({
    "string.empty": "blog:errors.tagNameRequired",
    "string.min": "blog:errors.tagNameTooShort",
    "string.max": "blog:errors.tagNameTooLong",
    "any.required": "blog:errors.tagNameRequired"
  })
});

export const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(50).required().messages({
    "string.empty": "blog:errors.categoryNameRequired",
    "string.min": "blog:errors.categoryNameTooShort",
    "string.max": "blog:errors.categoryNameTooLong",
    "any.required": "blog:errors.categoryNameRequired"
  })
});

export const blogIdParamSchema = Joi.object({
  id: Joi.string().pattern(OBJECTID_PATTERN).required().messages({
    "string.empty": "blog:errors.invalidId",
    "string.pattern.base": "blog:errors.invalidId",
    "any.required": "blog:errors.invalidId"
  })
});
