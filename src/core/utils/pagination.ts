export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginationResult {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Parse pagination parameters from request
 */
export const parsePagination = (params: PaginationParams) => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const skip = (page - 1) * limit;
  const sort = params.sort || "createdAt";
  const order = params.order === "asc" ? 1 : -1;

  return {
    page,
    limit,
    skip,
    sort: { [sort]: order }
  };
};

/**
 * Create pagination metadata
 */
export const createPaginationMeta = (
  totalItems: number,
  page: number,
  limit: number
): PaginationResult => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalPages,
    totalItems,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};
