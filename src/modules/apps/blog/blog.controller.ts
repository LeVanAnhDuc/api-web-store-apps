// libs
import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";

// types
import type { BlogService } from "./blog.service";
import type { BlogTagsController } from "./sub-modules/tags/blog-tags.controller";
import type { BlogCategoriesController } from "./sub-modules/categories/blog-categories.controller";
import type {
  CreateBlogDto,
  UpdateBlogDto,
  BlogQuery
} from "@/types/modules/blog";

// config
import { OkSuccess, CreatedSuccess } from "@/config/responses/success";

// utils
import { asyncHandler } from "@/utils/async-handler";

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

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    authId: string;
    email: string;
    roles: string;
  };
}

interface OptionalAuthRequest extends Request {
  user?: {
    userId: string;
    authId: string;
    email: string;
    roles: string;
  };
}

export class BlogController {
  public readonly router = Router();

  constructor(
    private readonly service: BlogService,
    private readonly authGuard: RequestHandler,
    private readonly optionalAuth: RequestHandler,
    private readonly tagsController: BlogTagsController,
    private readonly categoriesController: BlogCategoriesController
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    // Sub-module routes MUST come before /:slug to avoid conflicts
    this.router.use("/tags", this.tagsController.router);
    this.router.use("/categories", this.categoriesController.router);

    // Blog CRUD
    this.router.post(
      "/",
      this.authGuard,
      uploadBlogCover,
      bodyPipe(createBlogSchema),
      asyncHandler(this.createBlog)
    );

    this.router.get(
      "/",
      this.optionalAuth,
      queryPipe(listBlogsQuerySchema),
      asyncHandler(this.listBlogs)
    );

    this.router.get(
      "/:slug",
      this.optionalAuth,
      asyncHandler(this.getBlogBySlug)
    );

    this.router.patch(
      "/:id",
      this.authGuard,
      uploadBlogCover,
      paramsPipe(blogIdParamSchema),
      bodyPipe(updateBlogSchema),
      asyncHandler(this.updateBlog)
    );

    this.router.delete(
      "/:id",
      this.authGuard,
      paramsPipe(blogIdParamSchema),
      asyncHandler(this.deleteBlog)
    );
  }

  private createBlog = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const dto = req.body as CreateBlogDto;
    const file = req.file;
    const data = await this.service.createBlog(req.user.userId, dto, file);
    new CreatedSuccess({ data, message: "blog:success.created" }).send(
      req,
      res
    );
  };

  private listBlogs = async (
    req: OptionalAuthRequest,
    res: Response
  ): Promise<void> => {
    const query = req.query as unknown as BlogQuery;
    const data = await this.service.listBlogs(query, req.user);
    new OkSuccess({ data, message: "blog:success.listed" }).send(req, res);
  };

  private getBlogBySlug = async (
    req: OptionalAuthRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.getBlogBySlug(req.params.slug, req.user);
    new OkSuccess({ data, message: "blog:success.found" }).send(req, res);
  };

  private updateBlog = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const dto = req.body as UpdateBlogDto;
    const file = req.file;
    const data = await this.service.updateBlog(
      req.params.id,
      req.user.userId,
      dto,
      file
    );
    new OkSuccess({ data, message: "blog:success.updated" }).send(req, res);
  };

  private deleteBlog = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.deleteBlog(req.params.id, req.user);
    new OkSuccess({ data, message: "blog:success.deleted" }).send(req, res);
  };
}
