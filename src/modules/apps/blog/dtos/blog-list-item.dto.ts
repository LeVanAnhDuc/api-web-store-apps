// types
import type {
  BlogListItem,
  BlogAuthorInfo,
  BlogTagItem,
  BlogCoverImage
} from "../types";
// others
import { USER_CONFIG } from "@/constants/modules/user";

export type BlogListItemDto = BlogListItem;

export const toBlogListItemDto = (
  doc: Record<string, unknown>
): BlogListItemDto => {
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

  const categories = ((doc.categories as Record<string, unknown>[]) ?? []).map(
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
};
