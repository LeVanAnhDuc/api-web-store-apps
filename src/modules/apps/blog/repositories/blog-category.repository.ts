import BlogCategoryModel from "@/models/blog-category";
import type { BlogCategoryDocument } from "@/types/modules/blog";

export class BlogCategoryRepository {
  async search(query: string, limit: number): Promise<BlogCategoryDocument[]> {
    return BlogCategoryModel.find({ name: { $regex: query, $options: "i" } })
      .limit(limit)
      .sort({ name: 1 })
      .lean()
      .exec() as unknown as BlogCategoryDocument[];
  }

  async findByName(name: string): Promise<BlogCategoryDocument | null> {
    return BlogCategoryModel.findOne({ name: name.toLowerCase().trim() })
      .lean()
      .exec() as unknown as BlogCategoryDocument | null;
  }

  async create(name: string): Promise<BlogCategoryDocument> {
    const doc = await BlogCategoryModel.create({
      name: name.toLowerCase().trim()
    });
    return doc;
  }

  async findPopular(limit: number): Promise<BlogCategoryDocument[]> {
    return BlogCategoryModel.find()
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as BlogCategoryDocument[];
  }
}
