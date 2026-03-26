import type { Document, Types } from "mongoose";
import type { BLOG_VISIBILITY, BLOG_COVER_TYPE } from "@/constants/enums/blog";

// ─── Enum value types ──────────────────────────────────────────────────────

export type BlogVisibility =
  (typeof BLOG_VISIBILITY)[keyof typeof BLOG_VISIBILITY];
export type BlogCoverType =
  (typeof BLOG_COVER_TYPE)[keyof typeof BLOG_COVER_TYPE];

// ─── Mongoose Document types ───────────────────────────────────────────────

export interface BlogTagDocument extends Document {
  name: string;
  createdAt: Date;
}

export interface BlogCategoryDocument extends Document {
  name: string;
  createdAt: Date;
}

export interface BlogCoverImageDoc {
  type: BlogCoverType;
  url: string;
}

export interface BlogDocument extends Document {
  authorId: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  coverImage: BlogCoverImageDoc | null;
  tags: Types.ObjectId[];
  categories: Types.ObjectId[];
  visibility: BlogVisibility;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── DTOs ──────────────────────────────────────────────────────────────────

export interface CreateBlogDto {
  title: string;
  content: string;
  visibility?: BlogVisibility;
  tags?: string[];
  categories?: string[];
  coverUrl?: string;
}

export interface UpdateBlogDto {
  title?: string;
  content?: string;
  visibility?: BlogVisibility;
  tags?: string[];
  categories?: string[];
  coverUrl?: string;
  removeCover?: boolean;
}

export interface BlogQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  visibility?: BlogVisibility;
  sortBy?: "title" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface TagQuery {
  search?: string;
  limit?: number;
}

export interface CreateTagDto {
  name: string;
}

export interface CreateCategoryDto {
  name: string;
}

// ─── Response types ────────────────────────────────────────────────────────

export interface BlogAuthorInfo {
  id: string;
  name: string;
  avatar: string | null;
}

export interface BlogCoverImage {
  type: BlogCoverType;
  url: string;
}

export interface BlogTagItem {
  id: string;
  name: string;
}

export interface BlogListItem {
  id: string;
  title: string;
  slug: string;
  coverImage: BlogCoverImage | null;
  tags: BlogTagItem[];
  categories: BlogTagItem[];
  visibility: BlogVisibility;
  author: BlogAuthorInfo;
  createdAt: string;
  updatedAt: string;
}

export interface BlogDetailItem extends BlogListItem {
  content: string;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
