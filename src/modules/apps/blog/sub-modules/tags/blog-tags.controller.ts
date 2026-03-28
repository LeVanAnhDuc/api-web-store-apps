// libs
import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";

// types
import type { BlogTagsService } from "./blog-tags.service";
import type { TagQuery } from "@/types/modules/blog";

// config
import { OkSuccess, CreatedSuccess } from "@/config/responses/success";

// utils
import { asyncHandler } from "@/utils/async-handler";

// middlewares
import { bodyPipe, queryPipe } from "@/middlewares";

// validators
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
    private readonly authGuard: RequestHandler
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/",
      queryPipe(tagQuerySchema),
      asyncHandler(this.searchTags)
    );

    this.router.post(
      "/",
      this.authGuard,
      bodyPipe(createTagSchema),
      asyncHandler(this.createTag)
    );
  }

  private searchTags = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as TagQuery;
    const data = await this.service.searchTags(query);
    new OkSuccess({ data, message: "blog:success.tagsFound" }).send(req, res);
  };

  private createTag = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.createTag(req.body.name);
    new CreatedSuccess({ data, message: "blog:success.tagCreated" }).send(
      req,
      res
    );
  };
}
