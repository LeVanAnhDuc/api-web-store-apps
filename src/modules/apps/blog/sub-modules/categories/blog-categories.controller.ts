// libs
import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";

// types
import type { BlogCategoriesService } from "./blog-categories.service";
import type { TagQuery } from "@/types/modules/blog";

// config
import { OkSuccess, CreatedSuccess } from "@/config/responses/success";

// utils
import { asyncHandler } from "@/utils/async-handler";

// middlewares
import { bodyPipe, queryPipe } from "@/middlewares";

// validators
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
    private readonly authGuard: RequestHandler
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/",
      queryPipe(tagQuerySchema),
      asyncHandler(this.searchCategories)
    );

    this.router.post(
      "/",
      this.authGuard,
      bodyPipe(createCategorySchema),
      asyncHandler(this.createCategory)
    );
  }

  private searchCategories = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const query = req.query as unknown as TagQuery;
    const data = await this.service.searchCategories(query);
    new OkSuccess({ data, message: "blog:success.categoriesFound" }).send(
      req,
      res
    );
  };

  private createCategory = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.createCategory(req.body.name);
    new CreatedSuccess({ data, message: "blog:success.categoryCreated" }).send(
      req,
      res
    );
  };
}
