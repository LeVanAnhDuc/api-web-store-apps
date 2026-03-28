import type { RequestHandler } from "express";
import { MongoBlogRepository } from "./repositories/blog.repository";
import { MongoBlogTagRepository } from "./repositories/blog-tag.repository";
import { MongoBlogCategoryRepository } from "./repositories/blog-category.repository";
import { BlogService } from "./blog.service";
import { BlogTagsService } from "./sub-modules/tags/blog-tags.service";
import { BlogCategoriesService } from "./sub-modules/categories/blog-categories.service";
import { BlogTagsController } from "./sub-modules/tags/blog-tags.controller";
import { BlogCategoriesController } from "./sub-modules/categories/blog-categories.controller";
import { BlogController } from "./blog.controller";

export const createBlogModule = (
  auth: RequestHandler,
  optionalAuth: RequestHandler
) => {
  const blogRepo = new MongoBlogRepository();
  const tagRepo = new MongoBlogTagRepository();
  const categoryRepo = new MongoBlogCategoryRepository();

  const blogService = new BlogService(blogRepo);
  const tagsService = new BlogTagsService(tagRepo);
  const categoriesService = new BlogCategoriesService(categoryRepo);

  const tagsController = new BlogTagsController(tagsService, auth);
  const categoriesController = new BlogCategoriesController(
    categoriesService,
    auth
  );
  const blogController = new BlogController(
    blogService,
    auth,
    optionalAuth,
    tagsController,
    categoriesController
  );

  return { blogRouter: blogController.router };
};
