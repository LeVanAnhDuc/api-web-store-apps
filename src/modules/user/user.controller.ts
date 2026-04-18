// types
import type { Response } from "express";
import type {
  GetMyProfileRequest,
  UpdateProfileRequest,
  UploadAvatarRequest,
  GetPublicProfileRequest
} from "@/types/modules/user";
import type { UserService } from "./user.service";
// config
import { OkSuccess } from "@/config/responses/success";

export class UserController {
  constructor(private readonly service: UserService) {}

  getMyProfile = async (
    req: GetMyProfileRequest,
    res: Response
  ): Promise<void> => {
    const { sub: userId, authId } = req.user;
    const data = await this.service.getMyProfile(userId, authId);
    new OkSuccess({ data, message: "user:success.getProfile" }).send(req, res);
  };

  updateMyProfile = async (
    req: UpdateProfileRequest,
    res: Response
  ): Promise<void> => {
    const { sub: userId, authId } = req.user;
    const data = await this.service.updateMyProfile(userId, authId, req.body);
    new OkSuccess({ data, message: "user:success.updateProfile" }).send(
      req,
      res
    );
  };

  uploadAvatarHandler = async (
    req: UploadAvatarRequest,
    res: Response
  ): Promise<void> => {
    const { sub: userId } = req.user;
    const data = await this.service.updateAvatar(userId, req.file?.path);
    new OkSuccess({ data, message: "user:success.uploadAvatar" }).send(
      req,
      res
    );
  };

  getPublicProfile = async (
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
