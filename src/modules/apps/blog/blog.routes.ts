// libs
import { Router } from "express";
// types
import type { BlogController } from "./blog.controller";
// validators
import {
  createBlogSchema,
  updateBlogSchema,
  listBlogsQuerySchema,
  blogIdParamSchema
} from "@/validators/schemas/blog";
// others
import {
  authGuard,
  bodyPipe,
  optionalAuthGuard,
  paramsPipe,
  queryPipe,
  uploadBlogCover
} from "@/middlewares";
import { asyncHandler } from "@/utils/async-handler";

export const createBlogRoutes = (
  controller: BlogController,
  subModuleRouters: {
    tagsRouter: Router;
    categoriesRouter: Router;
  }
): Router => {
  const router = Router();
  const blogs = Router();

  // Sub-module routes MUST come before /:slug to avoid conflicts
  blogs.use("/tags", subModuleRouters.tagsRouter);
  blogs.use("/categories", subModuleRouters.categoriesRouter);

  blogs.post(
    "/",
    authGuard,
    uploadBlogCover,
    bodyPipe(createBlogSchema),
    asyncHandler(controller.createBlog)
  );

  blogs.get(
    "/",
    optionalAuthGuard,
    queryPipe(listBlogsQuerySchema),
    asyncHandler(controller.listBlogs)
  );

  blogs.get(
    "/:slug",
    optionalAuthGuard,
    asyncHandler(controller.getBlogBySlug)
  );

  blogs.patch(
    "/:id",
    authGuard,
    uploadBlogCover,
    paramsPipe(blogIdParamSchema),
    bodyPipe(updateBlogSchema),
    asyncHandler(controller.updateBlog)
  );

  blogs.delete(
    "/:id",
    authGuard,
    paramsPipe(blogIdParamSchema),
    asyncHandler(controller.deleteBlog)
  );

  router.use("/apps/blogs", blogs);
  return router;
};
