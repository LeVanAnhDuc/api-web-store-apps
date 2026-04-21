// types
import type { Types } from "mongoose";
import type { FilterQuery, SortOrder } from "mongoose";
import type { BlogDocument, UpdateBlogDto } from "../types";
// models
import BlogModel from "@/models/blog";
// others
import { asyncDatabaseHandler } from "@/utils/async-handler";

interface FindOptions {
  filter: FilterQuery<BlogDocument>;
  sort: Record<string, SortOrder>;
  skip: number;
  limit: number;
}

export type BlogRepository = {
  find(options: FindOptions): Promise<BlogDocument[]>;
  countDocuments(filter: FilterQuery<BlogDocument>): Promise<number>;
  findBySlug(slug: string): Promise<BlogDocument | null>;
  findById(id: string): Promise<BlogDocument | null>;
  findByIdAndUpdate(
    id: string,
    update: Partial<UpdateBlogDto> & {
      coverImage?: { type: string; url: string } | null;
      tags?: Types.ObjectId[];
      categories?: Types.ObjectId[];
    }
  ): Promise<BlogDocument | null>;
  softDelete(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;
  create(data: Partial<BlogDocument>): Promise<BlogDocument>;
  slugExists(slug: string): Promise<boolean>;
};

export class MongoBlogRepository implements BlogRepository {
  async find(options: FindOptions): Promise<BlogDocument[]> {
    return asyncDatabaseHandler(
      "find",
      () =>
        BlogModel.find(options.filter)
          .skip(options.skip)
          .limit(options.limit)
          .sort(options.sort)
          .populate("authorId", "fullName avatar")
          .populate("tags", "name")
          .populate("categories", "name")
          .lean()
          .exec() as unknown as Promise<BlogDocument[]>
    );
  }

  async countDocuments(filter: FilterQuery<BlogDocument>): Promise<number> {
    return asyncDatabaseHandler("countDocuments", () =>
      BlogModel.countDocuments(filter).exec()
    );
  }

  async findBySlug(slug: string): Promise<BlogDocument | null> {
    return asyncDatabaseHandler(
      "findBySlug",
      () =>
        BlogModel.findOne({ slug, deletedAt: null })
          .populate("authorId", "fullName avatar")
          .populate("tags", "name")
          .populate("categories", "name")
          .lean()
          .exec() as unknown as Promise<BlogDocument | null>
    );
  }

  async findById(id: string): Promise<BlogDocument | null> {
    return asyncDatabaseHandler(
      "findById",
      () =>
        BlogModel.findById(id)
          .lean()
          .exec() as unknown as Promise<BlogDocument | null>
    );
  }

  async findByIdAndUpdate(
    id: string,
    update: Partial<UpdateBlogDto> & {
      coverImage?: { type: string; url: string } | null;
      tags?: Types.ObjectId[];
      categories?: Types.ObjectId[];
    }
  ): Promise<BlogDocument | null> {
    return asyncDatabaseHandler(
      "findByIdAndUpdate",
      () =>
        BlogModel.findByIdAndUpdate(id, { $set: update }, { new: true })
          .populate("authorId", "fullName avatar")
          .populate("tags", "name")
          .populate("categories", "name")
          .lean()
          .exec() as unknown as Promise<BlogDocument | null>
    );
  }

  async softDelete(id: string): Promise<void> {
    await asyncDatabaseHandler("softDelete", () =>
      BlogModel.updateOne({ _id: id }, { $set: { deletedAt: new Date() } })
    );
  }

  async hardDelete(id: string): Promise<void> {
    await asyncDatabaseHandler("hardDelete", () =>
      BlogModel.deleteOne({ _id: id })
    );
  }

  async create(data: Partial<BlogDocument>): Promise<BlogDocument> {
    return asyncDatabaseHandler("create", async () => {
      const doc = await BlogModel.create(data);
      return BlogModel.findById(doc._id)
        .populate("authorId", "fullName avatar")
        .populate("tags", "name")
        .populate("categories", "name")
        .lean()
        .exec() as unknown as BlogDocument;
    });
  }

  async slugExists(slug: string): Promise<boolean> {
    return asyncDatabaseHandler("slugExists", async () => {
      const count = await BlogModel.countDocuments({ slug });
      return count > 0;
    });
  }
}
