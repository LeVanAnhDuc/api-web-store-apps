import type { BlogCategoryRepository } from "../../repositories/blog-category.repository";
import type { BlogTagItem, TagQuery } from "@/types/modules/blog";
import { ConflictRequestError } from "@/config/responses/error";

export class BlogCategoriesService {
  constructor(private readonly categoryRepo: BlogCategoryRepository) {}

  async searchCategories(query: TagQuery): Promise<BlogTagItem[]> {
    const limit = query.limit ?? 10;

    let docs;
    if (!query.search || query.search.trim() === "") {
      docs = await this.categoryRepo.findPopular(limit);
    } else {
      docs = await this.categoryRepo.search(query.search.trim(), limit);
    }

    return docs.map((doc) => ({
      id: (doc._id as unknown as { toString(): string }).toString(),
      name: doc.name
    }));
  }

  async createCategory(name: string): Promise<BlogTagItem> {
    const normalized = name.toLowerCase().trim();
    const existing = await this.categoryRepo.findByName(normalized);

    if (existing) {
      throw new ConflictRequestError(
        "blog:errors.categoryAlreadyExists",
        "CATEGORY_ALREADY_EXISTS"
      );
    }

    const doc = await this.categoryRepo.create(normalized);

    return {
      id: (doc._id as unknown as { toString(): string }).toString(),
      name: doc.name
    };
  }
}
