// types
import type { Response } from "express";
import type { BlogCategoriesService } from "./blog-categories.service";
import type {
  SearchCategoriesRequest,
  CreateCategoryRequest
} from "../../types";
// config
import { OkSuccess, CreatedSuccess } from "@/config/responses/success";

export class BlogCategoriesController {
  constructor(private readonly service: BlogCategoriesService) {}

  searchCategories = async (
    req: SearchCategoriesRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.searchCategories(req.query);
    new OkSuccess({ data, message: "blog:success.categoriesFound" }).send(
      req,
      res
    );
  };

  createCategory = async (
    req: CreateCategoryRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.createCategory(req.body.name);
    new CreatedSuccess({ data, message: "blog:success.categoryCreated" }).send(
      req,
      res
    );
  };
}
