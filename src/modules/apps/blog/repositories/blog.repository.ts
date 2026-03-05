import type { Types } from "mongoose";
import type { FilterQuery, SortOrder } from "mongoose";
import BlogModel from "@/models/blog";
import type { BlogDocument, UpdateBlogDto } from "@/types/modules/blog";

interface FindOptions {
  filter: FilterQuery<BlogDocument>;
  sort: Record<string, SortOrder>;
  skip: number;
  limit: number;
}

export class BlogRepository {
  async find(options: FindOptions): Promise<BlogDocument[]> {
    return BlogModel.find(options.filter)
      .skip(options.skip)
      .limit(options.limit)
      .sort(options.sort)
      .populate("authorId", "fullName avatar")
      .populate("tags", "name")
      .populate("categories", "name")
      .lean()
      .exec() as unknown as BlogDocument[];
  }

  async countDocuments(filter: FilterQuery<BlogDocument>): Promise<number> {
    return BlogModel.countDocuments(filter).exec();
  }

  async findBySlug(slug: string): Promise<BlogDocument | null> {
    return BlogModel.findOne({ slug, deletedAt: null })
      .populate("authorId", "fullName avatar")
      .populate("tags", "name")
      .populate("categories", "name")
      .lean()
      .exec() as unknown as BlogDocument | null;
  }

  async findById(id: string): Promise<BlogDocument | null> {
    return BlogModel.findById(id)
      .lean()
      .exec() as unknown as BlogDocument | null;
  }

  async findByIdAndUpdate(
    id: string,
    update: Partial<UpdateBlogDto> & {
      coverImage?: { type: string; url: string } | null;
      tags?: Types.ObjectId[];
      categories?: Types.ObjectId[];
    }
  ): Promise<BlogDocument | null> {
    return BlogModel.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate("authorId", "fullName avatar")
      .populate("tags", "name")
      .populate("categories", "name")
      .lean()
      .exec() as unknown as BlogDocument | null;
  }

  async softDelete(id: string): Promise<void> {
    await BlogModel.updateOne({ _id: id }, { $set: { deletedAt: new Date() } });
  }

  async hardDelete(id: string): Promise<void> {
    await BlogModel.deleteOne({ _id: id });
  }

  async create(data: Partial<BlogDocument>): Promise<BlogDocument> {
    const doc = await BlogModel.create(data);
    return BlogModel.findById(doc._id)
      .populate("authorId", "fullName avatar")
      .populate("tags", "name")
      .populate("categories", "name")
      .lean()
      .exec() as unknown as BlogDocument;
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await BlogModel.countDocuments({ slug });
    return count > 0;
  }
}
