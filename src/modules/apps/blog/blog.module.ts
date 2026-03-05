import type { AuthGuard } from "@/middlewares/auth.guard";
import type { OptionalAuthGuard } from "@/middlewares/optional-auth.guard";
import { BlogRepository } from "./repositories/blog.repository";
import { BlogTagRepository } from "./repositories/blog-tag.repository";
import { BlogCategoryRepository } from "./repositories/blog-category.repository";
import { BlogService } from "./blog.service";
import { BlogTagsService } from "./sub-modules/tags/blog-tags.service";
import { BlogCategoriesService } from "./sub-modules/categories/blog-categories.service";
import { BlogTagsController } from "./sub-modules/tags/blog-tags.controller";
import { BlogCategoriesController } from "./sub-modules/categories/blog-categories.controller";
import { BlogController } from "./blog.controller";

export const createBlogModule = (
  auth: AuthGuard,
  optionalAuth: OptionalAuthGuard
) => {
  const blogRepo = new BlogRepository();
  const tagRepo = new BlogTagRepository();
  const categoryRepo = new BlogCategoryRepository();

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
