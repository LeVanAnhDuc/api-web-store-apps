// types
import type { BlogDetailItem } from "../types";
// others
import { toBlogListItemDto } from "./blog-list-item.dto";

export type BlogDetailDto = BlogDetailItem;

export const toBlogDetailDto = (
  doc: Record<string, unknown>
): BlogDetailDto => {
  const base = toBlogListItemDto(doc);
  return { ...base, content: doc.content as string };
};
