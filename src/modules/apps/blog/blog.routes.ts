// libs
import { Router } from "express";
// types
import type { RequestHandler } from "express";
import type { BlogController } from "./blog.controller";
// middlewares
import {
  bodyPipe,
  paramsPipe,
  queryPipe,
  uploadBlogCover
} from "@/middlewares";
// validators
import {
  createBlogSchema,
  updateBlogSchema,
  listBlogsQuerySchema,
  blogIdParamSchema
} from "@/validators/schemas/blog";
// others
import { asyncHandler } from "@/utils/async-handler";

export const createBlogRoutes = (
  controller: BlogController,
  authGuard: RequestHandler,
  optionalAuth: RequestHandler,
  subModuleRouters: {
    tagsRouter: Router;
    categoriesRouter: Router;
  }
): Router => {
  const router = Router();

  // Sub-module routes MUST come before /:slug to avoid conflicts
  router.use("/tags", subModuleRouters.tagsRouter);
  router.use("/categories", subModuleRouters.categoriesRouter);

  router.post(
    "/",
    authGuard,
    uploadBlogCover,
    bodyPipe(createBlogSchema),
    asyncHandler(controller.createBlog)
  );

  router.get(
    "/",
    optionalAuth,
    queryPipe(listBlogsQuerySchema),
    asyncHandler(controller.listBlogs)
  );

  router.get("/:slug", optionalAuth, asyncHandler(controller.getBlogBySlug));

  router.patch(
    "/:id",
    authGuard,
    uploadBlogCover,
    paramsPipe(blogIdParamSchema),
    bodyPipe(updateBlogSchema),
    asyncHandler(controller.updateBlog)
  );

  router.delete(
    "/:id",
    authGuard,
    paramsPipe(blogIdParamSchema),
    asyncHandler(controller.deleteBlog)
  );

  return router;
};
