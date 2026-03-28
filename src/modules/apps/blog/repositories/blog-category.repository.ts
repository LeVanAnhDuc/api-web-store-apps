import BlogCategoryModel from "@/models/blog-category";
import type { BlogCategoryDocument } from "@/types/modules/blog";
import { asyncDatabaseHandler } from "@/utils/async-handler";

export type BlogCategoryRepository = {
  search(query: string, limit: number): Promise<BlogCategoryDocument[]>;
  findByName(name: string): Promise<BlogCategoryDocument | null>;
  create(name: string): Promise<BlogCategoryDocument>;
  findPopular(limit: number): Promise<BlogCategoryDocument[]>;
};

export class MongoBlogCategoryRepository implements BlogCategoryRepository {
  async search(query: string, limit: number): Promise<BlogCategoryDocument[]> {
    return asyncDatabaseHandler(
      "search",
      () =>
        BlogCategoryModel.find({ name: { $regex: query, $options: "i" } })
          .limit(limit)
          .sort({ name: 1 })
          .lean()
          .exec() as unknown as Promise<BlogCategoryDocument[]>
    );
  }

  async findByName(name: string): Promise<BlogCategoryDocument | null> {
    return asyncDatabaseHandler(
      "findByName",
      () =>
        BlogCategoryModel.findOne({ name: name.toLowerCase().trim() })
          .lean()
          .exec() as unknown as Promise<BlogCategoryDocument | null>
    );
  }

  async create(name: string): Promise<BlogCategoryDocument> {
    return asyncDatabaseHandler("create", () =>
      BlogCategoryModel.create({ name: name.toLowerCase().trim() })
    );
  }

  async findPopular(limit: number): Promise<BlogCategoryDocument[]> {
    return asyncDatabaseHandler(
      "findPopular",
      () =>
        BlogCategoryModel.find()
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean()
          .exec() as unknown as Promise<BlogCategoryDocument[]>
    );
  }
}
