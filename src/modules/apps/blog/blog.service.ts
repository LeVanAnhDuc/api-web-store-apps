// libs
import { Types } from "mongoose";
// types
import type { BlogRepository } from "./repositories/blog.repository";
import type {
  CreateBlogDto,
  UpdateBlogDto,
  BlogQuery,
  PaginatedResult
} from "@/types/modules/blog";
import type { BlogDetailDto, BlogListItemDto, DeleteBlogDto } from "./dtos";
// config
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError
} from "@/config/responses/error";
// dtos
import { toBlogListItemDto, toBlogDetailDto, toDeleteBlogDto } from "./dtos";
// others
import { BLOG_COVER_TYPE, BLOG_VISIBILITY } from "@/constants/modules/blog";
import {
  generateBaseSlug,
  appendTimestampToSlug,
  resolveCoverImage,
  deleteUploadedFile,
  buildBlogFilter,
  buildBlogSort
} from "./blog.helper";

interface RequestUser {
  userId: string;
  roles: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export class BlogService {
  constructor(private readonly blogRepo: BlogRepository) {}

  async createBlog(
    userId: string,
    dto: CreateBlogDto,
    file?: Express.Multer.File
  ): Promise<BlogDetailDto> {
    if (file && dto.coverUrl) {
      throw new BadRequestError(
        "blog:errors.coverConflict",
        "COVER_IMAGE_CONFLICT"
      );
    }

    const base = generateBaseSlug(dto.title);
    const exists = await this.blogRepo.slugExists(base);
    const slug = exists ? appendTimestampToSlug(base) : base;

    const coverImage = resolveCoverImage(file, dto.coverUrl);
    const tagIds = (dto.tags ?? []).map((id) => new Types.ObjectId(id));
    const categoryIds = (dto.categories ?? []).map(
      (id) => new Types.ObjectId(id)
    );

    const doc = await this.blogRepo.create({
      authorId: new Types.ObjectId(userId) as unknown as Types.ObjectId,
      title: dto.title,
      slug,
      content: dto.content,
      coverImage: coverImage ?? null,
      tags: tagIds as unknown as Types.ObjectId[],
      categories: categoryIds as unknown as Types.ObjectId[],
      visibility: dto.visibility ?? BLOG_VISIBILITY.PUBLIC,
      deletedAt: null
    });

    return toBlogDetailDto(doc as unknown as Record<string, unknown>);
  }

  async listBlogs(
    query: BlogQuery,
    user?: RequestUser
  ): Promise<PaginatedResult<BlogListItemDto>> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const filter = buildBlogFilter(query, user);
    const sort = buildBlogSort(query.sortBy, query.sortOrder);

    const [docs, total] = await Promise.all([
      this.blogRepo.find({ filter, sort, skip, limit }),
      this.blogRepo.countDocuments(filter)
    ]);

    return {
      items: docs.map((doc) =>
        toBlogListItemDto(doc as unknown as Record<string, unknown>)
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getBlogBySlug(
    slug: string,
    user?: RequestUser
  ): Promise<BlogDetailDto> {
    const doc = await this.blogRepo.findBySlug(slug);

    if (!doc) {
      throw new NotFoundError("blog:errors.notFound", "BLOG_NOT_FOUND");
    }

    if (doc.visibility === BLOG_VISIBILITY.PRIVATE) {
      const isOwner = user?.userId === doc.authorId.toString();
      const isAdmin = user?.roles === "admin";
      if (!isOwner && !isAdmin) {
        throw new NotFoundError("blog:errors.notFound", "BLOG_NOT_FOUND");
      }
    }

    return toBlogDetailDto(doc as unknown as Record<string, unknown>);
  }

  async updateBlog(
    id: string,
    userId: string,
    dto: UpdateBlogDto,
    file?: Express.Multer.File
  ): Promise<BlogDetailDto> {
    const existing = await this.blogRepo.findById(id);

    if (!existing) {
      throw new NotFoundError("blog:errors.notFound", "BLOG_NOT_FOUND");
    }

    if (existing.authorId.toString() !== userId) {
      throw new ForbiddenError("blog:errors.forbidden", "FORBIDDEN");
    }

    const coverResult = resolveCoverImage(file, dto.coverUrl, dto.removeCover);

    if (
      coverResult !== undefined &&
      existing.coverImage?.type === BLOG_COVER_TYPE.UPLOAD
    ) {
      deleteUploadedFile(existing.coverImage.url);
    }

    const updateData: Record<string, unknown> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.visibility !== undefined) updateData.visibility = dto.visibility;
    if (dto.tags !== undefined) {
      updateData.tags = dto.tags.map((id) => new Types.ObjectId(id));
    }
    if (dto.categories !== undefined) {
      updateData.categories = dto.categories.map(
        (id) => new Types.ObjectId(id)
      );
    }
    if (coverResult !== undefined) {
      updateData.coverImage = coverResult;
    }

    const updated = await this.blogRepo.findByIdAndUpdate(
      id,
      updateData as never
    );

    if (!updated) {
      throw new NotFoundError("blog:errors.notFound", "BLOG_NOT_FOUND");
    }

    return toBlogDetailDto(updated as unknown as Record<string, unknown>);
  }

  async deleteBlog(id: string, user: RequestUser): Promise<DeleteBlogDto> {
    const existing = await this.blogRepo.findById(id);

    if (!existing) {
      throw new NotFoundError("blog:errors.notFound", "BLOG_NOT_FOUND");
    }

    if (user.roles === "admin") {
      if (existing.coverImage?.type === BLOG_COVER_TYPE.UPLOAD) {
        deleteUploadedFile(existing.coverImage.url);
      }
      await this.blogRepo.hardDelete(id);
    } else {
      if (existing.authorId.toString() !== user.userId) {
        throw new ForbiddenError("blog:errors.forbidden", "FORBIDDEN");
      }
      await this.blogRepo.softDelete(id);
    }

    return toDeleteBlogDto(id);
  }
}
