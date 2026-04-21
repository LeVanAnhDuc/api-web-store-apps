// types
import type { BlogTagDocument } from "../types";
// models
import BlogTagModel from "@/models/blog-tag";
// others
import { asyncDatabaseHandler } from "@/utils/async-handler";

export type BlogTagRepository = {
  search(query: string, limit: number): Promise<BlogTagDocument[]>;
  findByName(name: string): Promise<BlogTagDocument | null>;
  create(name: string): Promise<BlogTagDocument>;
  findPopular(limit: number): Promise<BlogTagDocument[]>;
};

export class MongoBlogTagRepository implements BlogTagRepository {
  async search(query: string, limit: number): Promise<BlogTagDocument[]> {
    return asyncDatabaseHandler(
      "search",
      () =>
        BlogTagModel.find({ name: { $regex: query, $options: "i" } })
          .limit(limit)
          .sort({ name: 1 })
          .lean()
          .exec() as unknown as Promise<BlogTagDocument[]>
    );
  }

  async findByName(name: string): Promise<BlogTagDocument | null> {
    return asyncDatabaseHandler(
      "findByName",
      () =>
        BlogTagModel.findOne({ name: name.toLowerCase().trim() })
          .lean()
          .exec() as unknown as Promise<BlogTagDocument | null>
    );
  }

  async create(name: string): Promise<BlogTagDocument> {
    return asyncDatabaseHandler("create", () =>
      BlogTagModel.create({ name: name.toLowerCase().trim() })
    );
  }

  async findPopular(limit: number): Promise<BlogTagDocument[]> {
    return asyncDatabaseHandler(
      "findPopular",
      () =>
        BlogTagModel.find()
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean()
          .exec() as unknown as Promise<BlogTagDocument[]>
    );
  }
}
