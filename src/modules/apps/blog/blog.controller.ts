import { Router } from "express";
import type { Request, RequestHandler } from "express";
import type { BlogService } from "./blog.service";
import type { BlogTagsController } from "./sub-modules/tags/blog-tags.controller";
import type { BlogCategoriesController } from "./sub-modules/categories/blog-categories.controller";
import type { HandlerResult } from "@/types/http";
import type {
  CreateBlogDto,
  UpdateBlogDto,
  BlogQuery
} from "@/types/modules/blog";
import { STATUS_CODES } from "@/config/http";
import { asyncHandler } from "@/utils/async-handler";
import {
  bodyPipe,
  paramsPipe,
  queryPipe,
  uploadBlogCover
} from "@/middlewares";
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
    req: AuthenticatedRequest
  ): Promise<HandlerResult> => {
    const dto = req.body as CreateBlogDto;
    const file = req.file;
    const data = await this.service.createBlog(req.user.userId, dto, file);
    return {
      data,
      message: "blog:success.created",
      statusCode: STATUS_CODES.CREATED
    };
  };

  private listBlogs = async (
    req: OptionalAuthRequest
  ): Promise<HandlerResult> => {
    const query = req.query as unknown as BlogQuery;
    const data = await this.service.listBlogs(query, req.user);
    return {
      data,
      message: "blog:success.listed",
      statusCode: STATUS_CODES.OK
    };
  };

  private getBlogBySlug = async (
    req: OptionalAuthRequest
  ): Promise<HandlerResult> => {
    const data = await this.service.getBlogBySlug(req.params.slug, req.user);
    return {
      data,
      message: "blog:success.found",
      statusCode: STATUS_CODES.OK
    };
  };

  private updateBlog = async (
    req: AuthenticatedRequest
  ): Promise<HandlerResult> => {
    const dto = req.body as UpdateBlogDto;
    const file = req.file;
    const data = await this.service.updateBlog(
      req.params.id,
      req.user.userId,
      dto,
      file
    );
    return {
      data,
      message: "blog:success.updated",
      statusCode: STATUS_CODES.OK
    };
  };

  private deleteBlog = async (
    req: AuthenticatedRequest
  ): Promise<HandlerResult> => {
    const data = await this.service.deleteBlog(req.params.id, req.user);
    return {
      data,
      message: "blog:success.deleted",
      statusCode: STATUS_CODES.OK
    };
  };
}
