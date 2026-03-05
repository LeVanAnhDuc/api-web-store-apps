import { Schema, model, type Model } from "mongoose";
import type { BlogTagDocument } from "@/types/modules/blog";
import { MODEL_NAMES } from "@/constants/models";

const { BLOG_TAG } = MODEL_NAMES;

const BlogTagSchema = new Schema<BlogTagDocument>(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [50, "Tag name must not exceed 50 characters"]
    }
  },
  {
    collection: "blog_tags",
    timestamps: { createdAt: true, updatedAt: false }
  }
);

BlogTagSchema.index({ name: 1 }, { unique: true });

const BlogTagModel: Model<BlogTagDocument> = model<BlogTagDocument>(
  BLOG_TAG,
  BlogTagSchema
);

export default BlogTagModel;
