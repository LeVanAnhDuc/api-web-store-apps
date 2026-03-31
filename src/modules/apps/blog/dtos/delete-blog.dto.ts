export interface DeleteBlogDto {
  id: string;
}

export const toDeleteBlogDto = (id: string): DeleteBlogDto => ({ id });
