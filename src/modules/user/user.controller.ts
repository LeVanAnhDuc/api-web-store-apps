import { Router } from "express";
import type { AuthGuard } from "@/middlewares/guards/auth.guard";
import type { RateLimiterMiddleware } from "@/middlewares/common/rate-limiter";
import type { UserService } from "./user.service";
import type {
  GetMyProfileRequest,
  UpdateProfileRequest,
  UploadAvatarRequest,
  GetPublicProfileRequest
} from "@/types/modules/user";
import type { HandlerResult } from "@/types/http";
import { STATUS_CODES } from "@/config/http";
import { asyncHandler, asyncGuardHandler } from "@/utils/async-handler";
import { validate } from "@/validators/middleware";
import {
  updateProfileSchema,
  getPublicProfileSchema
} from "@/validators/schemas/user";
import { uploadAvatar } from "@/middlewares/interceptors/file-upload";
import { BadRequestError } from "@/config/responses/error";

export class UserController {
  public readonly router = Router();

  constructor(
    private readonly service: UserService,
    private readonly auth: AuthGuard,
    private readonly rl: RateLimiterMiddleware
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/me",
      asyncGuardHandler(this.auth),
      asyncHandler(this.getMyProfile)
    );

    this.router.patch(
      "/me",
      this.rl.updateProfileByIp,
      asyncGuardHandler(this.auth),
      validate(updateProfileSchema, "body"),
      asyncHandler(this.updateMyProfile)
    );

    this.router.post(
      "/me/avatar",
      this.rl.uploadAvatarByIp,
      asyncGuardHandler(this.auth),
      uploadAvatar,
      asyncHandler(this.uploadAvatarHandler)
    );

    this.router.get(
      "/:id",
      validate(getPublicProfileSchema, "params"),
      asyncHandler(this.getPublicProfile)
    );
  }

  private getMyProfile = async (
    req: GetMyProfileRequest
  ): Promise<HandlerResult> => {
    const { userId, email } = req.user;
    const data = await this.service.getMyProfile(userId, email);
    return {
      data,
      message: "user:success.getProfile",
      statusCode: STATUS_CODES.OK
    };
  };

  private updateMyProfile = async (
    req: UpdateProfileRequest
  ): Promise<HandlerResult> => {
    const { userId, email } = req.user;
    const data = await this.service.updateMyProfile(userId, email, req.body);
    return {
      data,
      message: "user:success.updateProfile",
      statusCode: STATUS_CODES.OK
    };
  };

  private uploadAvatarHandler = async (
    req: UploadAvatarRequest
  ): Promise<HandlerResult> => {
    if (!req.file) {
      throw new BadRequestError(
        "user:errors.noFileUploaded",
        "NO_FILE_UPLOADED"
      );
    }

    const { userId } = req.user;
    const data = await this.service.updateAvatar(userId, req.file.path);
    return {
      data,
      message: "user:success.uploadAvatar",
      statusCode: STATUS_CODES.OK
    };
  };

  private getPublicProfile = async (
    req: GetPublicProfileRequest
  ): Promise<HandlerResult> => {
    const data = await this.service.getPublicProfile(req.params.id);
    return {
      data,
      message: "user:success.getPublicProfile",
      statusCode: STATUS_CODES.OK
    };
  };
}
