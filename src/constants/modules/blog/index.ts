export const BLOG_VISIBILITY = {
  PUBLIC: "public",
  PRIVATE: "private"
} as const;

export const BLOG_COVER_TYPE = {
  UPLOAD: "upload",
  URL: "url"
} as const;

export const BLOG_CONFIG = {
  COVER_MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  COVER_UPLOAD_DIR: "uploads/blogs",
  MAX_TAGS: 30,
  MAX_CATEGORIES: 10
} as const;
