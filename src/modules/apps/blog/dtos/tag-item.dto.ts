// types
import type { BlogTagItem } from "@/types/modules/blog";

export type TagItemDto = BlogTagItem;

export const toTagItemDto = (doc: {
  _id: unknown;
  name: string;
}): TagItemDto => ({
  id: (doc._id as { toString(): string }).toString(),
  name: doc.name
});
