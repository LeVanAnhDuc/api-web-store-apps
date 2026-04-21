// types
import type { BlogTagItem } from "../types";

export type CategoryItemDto = BlogTagItem;

export const toCategoryItemDto = (doc: {
  _id: unknown;
  name: string;
}): CategoryItemDto => ({
  id: (doc._id as { toString(): string }).toString(),
  name: doc.name
});
