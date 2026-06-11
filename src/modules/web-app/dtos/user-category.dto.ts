// types
import type { WebAppCategoryDocument } from "../types";

export interface UserCategoryDto {
  _id: string;
  displayName: string;
}

export const toUserCategoryDto = (
  doc: WebAppCategoryDocument
): UserCategoryDto => ({
  _id: doc._id.toString(),
  displayName: doc.displayName
});
