// libs
import { Router } from "express";
// types
import type { RequestHandler } from "express";
import type { BlogTagsController } from "./blog-tags.controller";
// middlewares
import { bodyPipe, queryPipe } from "@/middlewares";
// validators
import { tagQuerySchema, createTagSchema } from "@/validators/schemas/blog";
// others
import { asyncHandler } from "@/utils/async-handler";

export const createBlogTagsRoutes = (
  controller: BlogTagsController,
  authGuard: RequestHandler
): Router => {
  const router = Router();

  router.get(
    "/",
    queryPipe(tagQuerySchema),
    asyncHandler(controller.searchTags)
  );

  router.post(
    "/",
    authGuard,
    bodyPipe(createTagSchema),
    asyncHandler(controller.createTag)
  );

  return router;
};
