// libs
import { Router } from "express";
// types
import type { RequestHandler } from "express";
import type { BlogCategoriesController } from "./blog-categories.controller";
// middlewares
import { bodyPipe, queryPipe } from "@/middlewares";
// validators
import {
  tagQuerySchema,
  createCategorySchema
} from "@/validators/schemas/blog";
// others
import { asyncHandler } from "@/utils/async-handler";

export const createBlogCategoriesRoutes = (
  controller: BlogCategoriesController,
  authGuard: RequestHandler
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
