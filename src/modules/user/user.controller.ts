// libs
import { Router } from "express";
import type { RequestHandler, Response } from "express";

// types
import type { RateLimiterMiddleware } from "@/middlewares";
import type { UserService } from "./user.service";
import type {
  GetMyProfileRequest,
  UpdateProfileRequest,
  UploadAvatarRequest,
  GetPublicProfileRequest
} from "@/types/modules/user";

// config
import { OkSuccess } from "@/config/responses/success";
import { BadRequestError } from "@/config/responses/error";

// utils
import { asyncHandler } from "@/utils/async-handler";

// middlewares
import { bodyPipe, paramsPipe, uploadAvatar } from "@/middlewares";

// validators
import {
  updateProfileSchema,
  getPublicProfileSchema
} from "@/validators/schemas/user";

export class UserController {
  public readonly router = Router();

  constructor(
    private readonly service: UserService,
    private readonly authGuard: RequestHandler,
    private readonly rl: RateLimiterMiddleware
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get("/me", this.authGuard, asyncHandler(this.getMyProfile));

    this.router.patch(
      "/me",
      this.rl.updateProfileByIp,
      this.authGuard,
      bodyPipe(updateProfileSchema),
      asyncHandler(this.updateMyProfile)
    );

    this.router.post(
      "/me/avatar",
      this.rl.uploadAvatarByIp,
      this.authGuard,
      uploadAvatar,
      asyncHandler(this.uploadAvatarHandler)
    );

    this.router.get(
      "/:id",
      paramsPipe(getPublicProfileSchema),
      asyncHandler(this.getPublicProfile)
    );
  }

  private getMyProfile = async (
    req: GetMyProfileRequest,
    res: Response
  ): Promise<void> => {
    const { userId, email } = req.user;
    const data = await this.service.getMyProfile(userId, email);
    new OkSuccess({ data, message: "user:success.getProfile" }).send(req, res);
  };

  private updateMyProfile = async (
    req: UpdateProfileRequest,
    res: Response
  ): Promise<void> => {
    const { userId, email } = req.user;
    const data = await this.service.updateMyProfile(userId, email, req.body);
    new OkSuccess({ data, message: "user:success.updateProfile" }).send(
      req,
      res
    );
  };

  private uploadAvatarHandler = async (
    req: UploadAvatarRequest,
    res: Response
  ): Promise<void> => {
    if (!req.file) {
      throw new BadRequestError(
        "user:errors.noFileUploaded",
        "NO_FILE_UPLOADED"
      );
    }

    const { userId } = req.user;
    const data = await this.service.updateAvatar(userId, req.file.path);
    new OkSuccess({ data, message: "user:success.uploadAvatar" }).send(
      req,
      res
    );
  };

  private getPublicProfile = async (
    req: GetPublicProfileRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.getPublicProfile(req.params.id);
    new OkSuccess({ data, message: "user:success.getPublicProfile" }).send(
      req,
      res
    );
  };
}
