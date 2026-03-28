import { Router } from "express";
import type { Request } from "express";
import type { AuthGuard } from "@/middlewares/guards/auth.guard";
import type { BlogCategoriesService } from "./blog-categories.service";
import type { HandlerResult } from "@/types/http";
import type { TagQuery } from "@/types/modules/blog";
import { STATUS_CODES } from "@/config/http";
import { asyncHandler } from "@/utils/async-handler";
import { validate } from "@/validators/middleware";
import {
  tagQuerySchema,
  createCategorySchema
} from "@/validators/schemas/blog";

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    authId: string;
    email: string;
    roles: string;
  };
}

export class BlogCategoriesController {
  public readonly router = Router();

  constructor(
    private readonly service: BlogCategoriesService,
    private readonly auth: AuthGuard
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/",
      validate(tagQuerySchema, "query"),
      asyncHandler(this.searchCategories)
    );

    this.router.post(
      "/",
      this.auth.middleware,
      validate(createCategorySchema, "body"),
      asyncHandler(this.createCategory)
    );
  }

  private searchCategories = async (req: Request): Promise<HandlerResult> => {
    const query = req.query as unknown as TagQuery;
    const data = await this.service.searchCategories(query);
    return {
      data,
      message: "blog:success.categoriesFound",
      statusCode: STATUS_CODES.OK
    };
  };

  private createCategory = async (
    req: AuthenticatedRequest
  ): Promise<HandlerResult> => {
    const data = await this.service.createCategory(req.body.name);
    return {
      data,
      message: "blog:success.categoryCreated",
      statusCode: STATUS_CODES.CREATED
    };
  };
}
