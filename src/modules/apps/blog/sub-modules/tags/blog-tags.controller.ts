// types
import type { Response } from "express";
import type { BlogTagsService } from "./blog-tags.service";
import type { SearchTagsRequest, CreateTagRequest } from "../../types";
// config
import { OkSuccess, CreatedSuccess } from "@/config/responses/success";

export class BlogTagsController {
  constructor(private readonly service: BlogTagsService) {}

  searchTags = async (req: SearchTagsRequest, res: Response): Promise<void> => {
    const data = await this.service.searchTags(req.query);
    new OkSuccess({ data, message: "blog:success.tagsFound" }).send(req, res);
  };

  createTag = async (req: CreateTagRequest, res: Response): Promise<void> => {
    const data = await this.service.createTag(req.body.name);
    new CreatedSuccess({ data, message: "blog:success.tagCreated" }).send(
      req,
      res
    );
  };
}
