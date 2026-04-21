// libs
import { Schema, model, type Model } from "mongoose";
// types
import type { BlogDocument } from "@/modules/apps/blog/types";
// others
import {
  BLOG_VISIBILITY,
  BLOG_COVER_TYPE,
  BLOG_CONFIG
} from "@/modules/apps/blog/constants";
import { MODEL_NAMES } from "@/constants/models";

const { BLOG, USER, BLOG_TAG, BLOG_CATEGORY } = MODEL_NAMES;

const BlogCoverImageSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: Object.values(BLOG_COVER_TYPE)
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const BlogSchema = new Schema<BlogDocument>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: USER,
      required: [true, "Author ID is required"],
      index: true
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title must not exceed 200 characters"]
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    content: {
      type: String,
      required: [true, "Content is required"]
    },
    coverImage: {
      type: BlogCoverImageSchema,
      default: null
    },
    tags: {
      type: [Schema.Types.ObjectId],
      ref: BLOG_TAG,
      default: [],
      validate: [
        {
          validator: (v: unknown[]) => v.length <= BLOG_CONFIG.MAX_TAGS,
          message: `Tags must not exceed ${BLOG_CONFIG.MAX_TAGS} items`
        }
      ]
    },
    categories: {
      type: [Schema.Types.ObjectId],
      ref: BLOG_CATEGORY,
      default: [],
      validate: [
        {
          validator: (v: unknown[]) => v.length <= BLOG_CONFIG.MAX_CATEGORIES,
          message: `Categories must not exceed ${BLOG_CONFIG.MAX_CATEGORIES} items`
        }
      ]
    },
    visibility: {
      type: String,
      required: [true, "Visibility is required"],
      enum: Object.values(BLOG_VISIBILITY),
      default: BLOG_VISIBILITY.PUBLIC
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    collection: "blogs",
    timestamps: true
  }
);

BlogSchema.index({ slug: 1 }, { unique: true });
BlogSchema.index({ authorId: 1, createdAt: -1 });
BlogSchema.index({ authorId: 1, deletedAt: 1, createdAt: -1 });
BlogSchema.index({ visibility: 1, deletedAt: 1, createdAt: -1 });
BlogSchema.index({ tags: 1, deletedAt: 1 });
BlogSchema.index({ categories: 1, deletedAt: 1 });
BlogSchema.index({ title: "text" });

const BlogModel: Model<BlogDocument> = model<BlogDocument>(BLOG, BlogSchema);

export default BlogModel;
