import type { BlogTagRepository } from "../../repositories/blog-tag.repository";
import type { BlogTagItem, TagQuery } from "@/types/modules/blog";
import { ConflictRequestError } from "@/config/responses/error";

export class BlogTagsService {
  constructor(private readonly tagRepo: BlogTagRepository) {}

  async searchTags(query: TagQuery): Promise<BlogTagItem[]> {
    const limit = query.limit ?? 10;

    let docs;
    if (!query.search || query.search.trim() === "") {
      docs = await this.tagRepo.findPopular(limit);
    } else {
      docs = await this.tagRepo.search(query.search.trim(), limit);
    }

    return docs.map((doc) => ({
      id: (doc._id as unknown as { toString(): string }).toString(),
      name: doc.name
    }));
  }

  async createTag(name: string): Promise<BlogTagItem> {
    const normalized = name.toLowerCase().trim();
    const existing = await this.tagRepo.findByName(normalized);

    if (existing) {
      throw new ConflictRequestError(
        "blog:errors.tagAlreadyExists",
        "TAG_ALREADY_EXISTS"
      );
    }

    const doc = await this.tagRepo.create(normalized);

    return {
      id: (doc._id as unknown as { toString(): string }).toString(),
      name: doc.name
    };
  }
}
