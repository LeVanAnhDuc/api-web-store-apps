import { Schema, model, type Model } from "mongoose";
import type { BlogCategoryDocument } from "@/types/modules/blog";
import { MODEL_NAMES } from "@/constants/models";

const { BLOG_CATEGORY } = MODEL_NAMES;

const BlogCategorySchema = new Schema<BlogCategoryDocument>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [50, "Category name must not exceed 50 characters"]
    }
  },
  {
    collection: "blog_categories",
    timestamps: { createdAt: true, updatedAt: false }
  }
);

BlogCategorySchema.index({ name: 1 }, { unique: true });

const BlogCategoryModel: Model<BlogCategoryDocument> =
  model<BlogCategoryDocument>(BLOG_CATEGORY, BlogCategorySchema);

export default BlogCategoryModel;
