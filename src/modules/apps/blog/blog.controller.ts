// types
import type { Response } from "express";
import type { BlogService } from "./blog.service";
import type {
  CreateBlogRequest,
  ListBlogsRequest,
  GetBlogBySlugRequest,
  UpdateBlogRequest,
  DeleteBlogRequest
} from "./types";
// common
import { OkSuccess, CreatedSuccess } from "@/common/responses";

export class BlogController {
  constructor(private readonly service: BlogService) {}

  createBlog = async (req: CreateBlogRequest, res: Response): Promise<void> => {
    const data = await this.service.createBlog(
      req.user.sub,
      req.body,
      req.file
    );
    new CreatedSuccess({ data, message: "blog:success.created" }).send(
      req,
      res
    );
  };

  listBlogs = async (req: ListBlogsRequest, res: Response): Promise<void> => {
    const data = await this.service.listBlogs(req.query, req.user);
    new OkSuccess({ data, message: "blog:success.listed" }).send(req, res);
  };

  getBlogBySlug = async (
    req: GetBlogBySlugRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.getBlogBySlug(req.params.slug, req.user);
    new OkSuccess({ data, message: "blog:success.found" }).send(req, res);
  };

  updateBlog = async (req: UpdateBlogRequest, res: Response): Promise<void> => {
    const data = await this.service.updateBlog(
      req.params.id,
      req.user.sub,
      req.body,
      req.file
    );
    new OkSuccess({ data, message: "blog:success.updated" }).send(req, res);
  };

  deleteBlog = async (req: DeleteBlogRequest, res: Response): Promise<void> => {
    const data = await this.service.deleteBlog(req.params.id, req.user);
    new OkSuccess({ data, message: "blog:success.deleted" }).send(req, res);
  };
}
