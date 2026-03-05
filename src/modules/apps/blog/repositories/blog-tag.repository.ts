import BlogTagModel from "@/models/blog-tag";
import type { BlogTagDocument } from "@/types/modules/blog";

export class BlogTagRepository {
  async search(query: string, limit: number): Promise<BlogTagDocument[]> {
    return BlogTagModel.find({ name: { $regex: query, $options: "i" } })
      .limit(limit)
      .sort({ name: 1 })
      .lean()
      .exec() as unknown as BlogTagDocument[];
  }

  async findByName(name: string): Promise<BlogTagDocument | null> {
    return BlogTagModel.findOne({ name: name.toLowerCase().trim() })
      .lean()
      .exec() as unknown as BlogTagDocument | null;
  }

  async create(name: string): Promise<BlogTagDocument> {
    const doc = await BlogTagModel.create({
      name: name.toLowerCase().trim()
    });
    return doc;
  }

  async findPopular(limit: number): Promise<BlogTagDocument[]> {
    return BlogTagModel.find()
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as BlogTagDocument[];
  }
}
