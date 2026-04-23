// types
import type { BlogCategoryRepository } from "../../repositories";
import type { TagQuery } from "../../types";
import type { CategoryItemDto } from "../../dtos";
// common
import { ConflictRequestError } from "@/common/exceptions";
// dtos
import { toCategoryItemDto } from "../../dtos";
// others
import { ERROR_CODES } from "@/constants/error-code";

export class BlogCategoriesService {
  constructor(private readonly categoryRepo: BlogCategoryRepository) {}

  async searchCategories(query: TagQuery): Promise<CategoryItemDto[]> {
    const limit = query.limit ?? 10;

    const docs =
      !query.search || query.search.trim() === ""
        ? await this.categoryRepo.findPopular(limit)
        : await this.categoryRepo.search(query.search.trim(), limit);

    return docs.map(toCategoryItemDto);
  }

  async createCategory(name: string): Promise<CategoryItemDto> {
    const normalized = name.toLowerCase().trim();
    const existing = await this.categoryRepo.findByName(normalized);

    if (existing) {
      throw new ConflictRequestError(
        "blog:errors.categoryAlreadyExists",
        ERROR_CODES.BLOG_CATEGORY_EXISTS
      );
    }

    const doc = await this.categoryRepo.create(normalized);
    return toCategoryItemDto(doc);
  }
}
