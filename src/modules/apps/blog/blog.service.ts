import slugify from "slugify";
import { Types } from "mongoose";
import path from "path";
import fs from "fs";
import type { BlogRepository } from "./repositories/blog.repository";
import type {
  CreateBlogDto,
  UpdateBlogDto,
  BlogQuery,
  BlogListItem,
  BlogDetailItem,
  BlogCoverImage,
  BlogAuthorInfo,
  BlogTagItem,
  PaginatedResult
} from "@/types/modules/blog";
import { BLOG_COVER_TYPE, BLOG_VISIBILITY } from "@/constants/enums";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError
} from "@/config/responses/error";
import { buildBlogFilter, buildBlogSort } from "./internals/query-builder";
import { USER_CONFIG } from "@/constants/config";

interface RequestUser {
  userId: string;
  roles: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export class BlogService {
  constructor(private readonly blogRepo: BlogRepository) {}

  async generateSlug(title: string): Promise<string> {
    const base = slugify(title, {
      lower: true,
      strict: true,
      trim: true
    });

    const exists = await this.blogRepo.slugExists(base);
    if (!exists) return base;

    const timestamp = Math.floor(Date.now() / 1000);
    return `${base}-${timestamp}`;
  }

  resolveCoverImage(
    file?: Express.Multer.File,
    coverUrl?: string,
    removeCover?: boolean
  ): { type: string; url: string } | null | undefined {
    if (removeCover === true) return null;
    if (file) {
      const relativePath = file.path.replace(/\\/g, "/");
      const normalized = relativePath.includes("uploads/")
        ? relativePath.substring(relativePath.indexOf("uploads/"))
        : relativePath;
      return { type: BLOG_COVER_TYPE.UPLOAD, url: `/${normalized}` };
    }
    if (coverUrl) {
      return { type: BLOG_COVER_TYPE.URL, url: coverUrl };
    }
    return undefined;
  }

  private deleteUploadedFile(filePath: string): void {
    try {
      const absolutePath = path.join(process.cwd(), filePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch {
      // ignore file deletion errors
    }
  }

  private mapBlogDoc(doc: Record<string, unknown>): BlogListItem {
    const author = doc.authorId as Record<string, unknown>;
    const authorInfo: BlogAuthorInfo = author
      ? {
          id: (author._id as unknown as { toString(): string }).toString(),
          name: (author.fullName as string) ?? "",
          avatar: author.avatar
            ? `${USER_CONFIG.BASE_URL}/${(author.avatar as string).replace(/\\/g, "/").replace(/^\//, "")}`
            : null
        }
      : { id: "", name: "", avatar: null };

    const tags = ((doc.tags as Record<string, unknown>[]) ?? []).map(
      (t): BlogTagItem => ({
        id: (t._id as unknown as { toString(): string }).toString(),
        name: t.name as string
      })
    );

    const categories = (
      (doc.categories as Record<string, unknown>[]) ?? []
    ).map(
      (c): BlogTagItem => ({
        id: (c._id as unknown as { toString(): string }).toString(),
        name: c.name as string
      })
    );

    const coverDoc = doc.coverImage as
      | { type: string; url: string }
      | null
      | undefined;
    const coverImage: BlogCoverImage | null = coverDoc
      ? { type: coverDoc.type as "upload" | "url", url: coverDoc.url }
      : null;

    return {
      id: (doc._id as unknown as { toString(): string }).toString(),
      title: doc.title as string,
      slug: doc.slug as string,
      coverImage,
      tags,
      categories,
      visibility: doc.visibility as "public" | "private",
      author: authorInfo,
      createdAt: (doc.createdAt as Date).toISOString(),
      updatedAt: (doc.updatedAt as Date).toISOString()
    };
  }

  async createBlog(
    userId: string,
    dto: CreateBlogDto,
    file?: Express.Multer.File
  ): Promise<BlogDetailItem> {
    if (file && dto.coverUrl) {
      throw new BadRequestError(
        "blog:errors.coverConflict",
        "COVER_IMAGE_CONFLICT"
      );
    }

    const slug = await this.generateSlug(dto.title);
    const coverImage = this.resolveCoverImage(file, dto.coverUrl);

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

    const base = this.mapBlogDoc(doc as unknown as Record<string, unknown>);
    return { ...base, content: doc.content };
  }

  async listBlogs(
    query: BlogQuery,
    user?: RequestUser
  ): Promise<PaginatedResult<BlogListItem>> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const filter = buildBlogFilter(query, user);
    const sort = buildBlogSort(query.sortBy, query.sortOrder);

    const [docs, total] = await Promise.all([
      this.blogRepo.find({ filter, sort, skip, limit }),
      this.blogRepo.countDocuments(filter)
    ]);

    const items = docs.map((doc) =>
      this.mapBlogDoc(doc as unknown as Record<string, unknown>)
    );

    return {
      items,
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
  ): Promise<BlogDetailItem> {
    const doc = await this.blogRepo.findBySlug(slug);

    if (!doc) {
      throw new NotFoundError("blog:errors.notFound", "BLOG_NOT_FOUND");
    }

    // Private blog access control — return 404 instead of 403 (security by obscurity)
    if (doc.visibility === BLOG_VISIBILITY.PRIVATE) {
      const isOwner = user?.userId === doc.authorId.toString();
      const isAdmin = user?.roles === "admin";
      if (!isOwner && !isAdmin) {
        throw new NotFoundError("blog:errors.notFound", "BLOG_NOT_FOUND");
      }
    }

    const base = this.mapBlogDoc(doc as unknown as Record<string, unknown>);
    return { ...base, content: doc.content };
  }

  async updateBlog(
    id: string,
    userId: string,
    dto: UpdateBlogDto,
    file?: Express.Multer.File
  ): Promise<BlogDetailItem> {
    const existing = await this.blogRepo.findById(id);

    if (!existing) {
      throw new NotFoundError("blog:errors.notFound", "BLOG_NOT_FOUND");
    }

    if (existing.authorId.toString() !== userId) {
      throw new ForbiddenError("blog:errors.forbidden", "FORBIDDEN");
    }

    const coverResult = this.resolveCoverImage(
      file,
      dto.coverUrl,
      dto.removeCover
    );

    // Delete old uploaded file if cover is being replaced/removed
    if (
      coverResult !== undefined &&
      existing.coverImage?.type === BLOG_COVER_TYPE.UPLOAD
    ) {
      this.deleteUploadedFile(existing.coverImage.url);
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

    const base = this.mapBlogDoc(updated as unknown as Record<string, unknown>);
    return { ...base, content: updated.content };
  }

  async deleteBlog(id: string, user: RequestUser): Promise<{ id: string }> {
    const existing = await this.blogRepo.findById(id);

    if (!existing) {
      throw new NotFoundError("blog:errors.notFound", "BLOG_NOT_FOUND");
    }

    if (user.roles === "admin") {
      // Admin: hard delete — also remove uploaded file
      if (existing.coverImage?.type === BLOG_COVER_TYPE.UPLOAD) {
        this.deleteUploadedFile(existing.coverImage.url);
      }
      await this.blogRepo.hardDelete(id);
    } else {
      if (existing.authorId.toString() !== user.userId) {
        throw new ForbiddenError("blog:errors.forbidden", "FORBIDDEN");
      }
      await this.blogRepo.softDelete(id);
    }

    return { id };
  }
}
