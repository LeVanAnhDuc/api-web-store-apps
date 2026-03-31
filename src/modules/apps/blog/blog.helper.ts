// libs
import slugify from "slugify";
import path from "path";
import fs from "fs";
import { Types } from "mongoose";
// types
import type { FilterQuery, SortOrder } from "mongoose";
import type { BlogDocument, BlogQuery } from "@/types/modules/blog";
// others
import { BLOG_COVER_TYPE, BLOG_VISIBILITY } from "@/constants/modules/blog";

interface RequestUser {
  userId: string;
  roles: string;
}

// ─── Slug ─────────────────────────────────────────────────────────────────

export const generateBaseSlug = (title: string): string =>
  slugify(title, { lower: true, strict: true, trim: true });

export const appendTimestampToSlug = (base: string): string => {
  const timestamp = Math.floor(Date.now() / 1000);
  return `${base}-${timestamp}`;
};

// ─── Cover image ──────────────────────────────────────────────────────────

export const resolveCoverImage = (
  file?: Express.Multer.File,
  coverUrl?: string,
  removeCover?: boolean
): { type: string; url: string } | null | undefined => {
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
};

export const deleteUploadedFile = (filePath: string): void => {
  try {
    const absolutePath = path.join(process.cwd(), filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch {
    // ignore file deletion errors
  }
};

// ─── Query builder ────────────────────────────────────────────────────────

export const buildBlogFilter = (
  query: BlogQuery,
  user?: RequestUser
): FilterQuery<BlogDocument> => {
  const filter: FilterQuery<BlogDocument> = { deletedAt: null };

  // Visibility logic
  if (!user) {
    filter.visibility = BLOG_VISIBILITY.PUBLIC;
  } else if (user.roles === "admin") {
    if (query.visibility) {
      filter.visibility = query.visibility;
    }
  } else {
    if (query.visibility === BLOG_VISIBILITY.PRIVATE) {
      filter.visibility = BLOG_VISIBILITY.PRIVATE;
      filter.authorId = new Types.ObjectId(user.userId);
    } else if (query.visibility === BLOG_VISIBILITY.PUBLIC) {
      filter.visibility = BLOG_VISIBILITY.PUBLIC;
    } else {
      filter.$or = [
        { visibility: BLOG_VISIBILITY.PUBLIC },
        {
          visibility: BLOG_VISIBILITY.PRIVATE,
          authorId: new Types.ObjectId(user.userId)
        }
      ];
    }
  }

  if (query.authorId) {
    filter.authorId = new Types.ObjectId(query.authorId);
  }
  if (query.categoryId) {
    filter.categories = new Types.ObjectId(query.categoryId);
  }
  if (query.tagId) {
    filter.tags = new Types.ObjectId(query.tagId);
  }
  if (query.search) {
    filter.title = { $regex: query.search, $options: "i" };
  }

  return filter;
};

export const buildBlogSort = (
  sortBy: "title" | "createdAt" = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
): Record<string, SortOrder> => {
  const order: SortOrder = sortOrder === "asc" ? 1 : -1;
  if (sortBy === "title") return { title: order };
  return { createdAt: order };
};
