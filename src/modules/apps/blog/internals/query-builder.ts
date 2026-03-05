import { Types } from "mongoose";
import type { FilterQuery, SortOrder } from "mongoose";
import { BLOG_VISIBILITY } from "@/constants/enums";
import type { BlogDocument, BlogQuery } from "@/types/modules/blog";

interface RequestUser {
  userId: string;
  roles: string;
}

export function buildBlogFilter(
  query: BlogQuery,
  user?: RequestUser
): FilterQuery<BlogDocument> {
  const filter: FilterQuery<BlogDocument> = { deletedAt: null };

  // Visibility logic
  if (!user) {
    // Guest: public only
    filter.visibility = BLOG_VISIBILITY.PUBLIC;
  } else if (user.roles === "admin") {
    // Admin: all visibility, optionally filter by query.visibility
    if (query.visibility) {
      filter.visibility = query.visibility;
    }
  } else {
    // Authenticated user: public + own private
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

  // authorId filter (profile page context)
  if (query.authorId) {
    filter.authorId = new Types.ObjectId(query.authorId);
  }

  // category / tag filter
  if (query.categoryId) {
    filter.categories = new Types.ObjectId(query.categoryId);
  }
  if (query.tagId) {
    filter.tags = new Types.ObjectId(query.tagId);
  }

  // Text search on title
  if (query.search) {
    filter.title = { $regex: query.search, $options: "i" };
  }

  return filter;
}

export function buildBlogSort(
  sortBy: "title" | "createdAt" = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
): Record<string, SortOrder> {
  const order: SortOrder = sortOrder === "asc" ? 1 : -1;

  if (sortBy === "title") {
    return { title: order };
  }

  return { createdAt: order };
}
