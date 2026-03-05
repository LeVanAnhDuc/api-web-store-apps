import { Router } from "express";
import type { Request } from "express";
import type { AuthGuard } from "@/middlewares/auth.guard";
import type { BlogTagsService } from "./blog-tags.service";
import type { HandlerResult } from "@/types/http";
import type { TagQuery } from "@/types/modules/blog";
import { STATUS_CODES } from "@/config/http";
import { asyncHandler } from "@/utils/async-handler";
import { validate } from "@/validators/middleware";
import { tagQuerySchema, createTagSchema } from "@/validators/schemas/blog";

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    authId: string;
    email: string;
    roles: string;
  };
}

export class BlogTagsController {
  public readonly router = Router();

  constructor(
    private readonly service: BlogTagsService,
    private readonly auth: AuthGuard
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/",
      validate(tagQuerySchema, "query"),
      asyncHandler(this.searchTags)
    );

    this.router.post(
      "/",
      this.auth.middleware,
      validate(createTagSchema, "body"),
      asyncHandler(this.createTag)
    );
  }

  private searchTags = async (req: Request): Promise<HandlerResult> => {
    const query = req.query as unknown as TagQuery;
    const data = await this.service.searchTags(query);
    return {
      data,
      message: "blog:success.tagsFound",
      statusCode: STATUS_CODES.OK
    };
  };

  private createTag = async (
    req: AuthenticatedRequest
  ): Promise<HandlerResult> => {
    const data = await this.service.createTag(req.body.name);
    return {
      data,
      message: "blog:success.tagCreated",
      statusCode: STATUS_CODES.CREATED
    };
  };
}
