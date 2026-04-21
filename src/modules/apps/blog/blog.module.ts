// repositories
import {
  MongoBlogRepository,
  MongoBlogTagRepository,
  MongoBlogCategoryRepository
} from "./repositories";
// others
import { BlogService } from "./blog.service";
import { BlogTagsService } from "./sub-modules/tags/blog-tags.service";
import { BlogCategoriesService } from "./sub-modules/categories/blog-categories.service";
import { BlogTagsController } from "./sub-modules/tags/blog-tags.controller";
import { BlogCategoriesController } from "./sub-modules/categories/blog-categories.controller";
import { BlogController } from "./blog.controller";
import { createBlogRoutes } from "./blog.routes";
import { createBlogTagsRoutes } from "./sub-modules/tags/blog-tags.routes";
import { createBlogCategoriesRoutes } from "./sub-modules/categories/blog-categories.routes";

export const createBlogModule = () => {
  const blogRepo = new MongoBlogRepository();
  const tagRepo = new MongoBlogTagRepository();
  const categoryRepo = new MongoBlogCategoryRepository();

  const blogService = new BlogService(blogRepo);
  const tagsService = new BlogTagsService(tagRepo);
  const categoriesService = new BlogCategoriesService(categoryRepo);

  const tagsController = new BlogTagsController(tagsService);
  const categoriesController = new BlogCategoriesController(categoriesService);
  const blogController = new BlogController(blogService);

  const tagsRouter = createBlogTagsRoutes(tagsController);
  const categoriesRouter = createBlogCategoriesRoutes(categoriesController);

  return {
    blogRouter: createBlogRoutes(blogController, {
      tagsRouter,
      categoriesRouter
    })
  };
};
