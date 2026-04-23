// libs
import { Router } from "express";
// types
import type { BlogCategoriesController } from "./blog-categories.controller";
// validators
import {
  tagQuerySchema,
  createCategorySchema
} from "@/validators/schemas/blog";
// others
import { authGuard, bodyPipe, queryPipe } from "@/middlewares";
import { asyncHandler } from "@/utils/async-handler";

export const createBlogCategoriesRoutes = (
  controller: BlogCategoriesController
): Router => {
  const router = Router();

  router.get(
    "/",
    queryPipe(tagQuerySchema),
    asyncHandler(controller.searchCategories)
  );

  router.post(
    "/",
    authGuard,
    bodyPipe(createCategorySchema),
    asyncHandler(controller.createCategory)
  );

  return router;
};
