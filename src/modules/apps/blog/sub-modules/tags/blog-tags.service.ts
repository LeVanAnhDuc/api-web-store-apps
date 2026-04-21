// types
import type { BlogTagRepository } from "../../repositories";
import type { TagQuery } from "../../types";
import type { TagItemDto } from "../../dtos";
// config
import { ConflictRequestError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { toTagItemDto } from "../../dtos";

export class BlogTagsService {
  constructor(private readonly tagRepo: BlogTagRepository) {}

  async searchTags(query: TagQuery): Promise<TagItemDto[]> {
    const limit = query.limit ?? 10;

    const docs =
      !query.search || query.search.trim() === ""
        ? await this.tagRepo.findPopular(limit)
        : await this.tagRepo.search(query.search.trim(), limit);

    return docs.map(toTagItemDto);
  }

  async createTag(name: string): Promise<TagItemDto> {
    const normalized = name.toLowerCase().trim();
    const existing = await this.tagRepo.findByName(normalized);

    if (existing) {
      throw new ConflictRequestError(
        "blog:errors.tagAlreadyExists",
        ERROR_CODES.BLOG_TAG_EXISTS
      );
    }

    const doc = await this.tagRepo.create(normalized);
    return toTagItemDto(doc);
  }
}
