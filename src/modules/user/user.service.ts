// libs
import path from "path";
// types
import type {
  CreateUserData,
  UserRecord,
  UpdateProfileData
} from "@/types/modules/user";
import type { ClientSession } from "mongoose";
import type { UserRepository } from "./repositories/user.repository";
import type { MyProfileDto, PublicProfileDto, UploadAvatarDto } from "./dtos";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
// config
import { BadRequestError, NotFoundError } from "@/config/responses/error";
// dtos
import { toMyProfileDto, toPublicProfileDto, toUploadAvatarDto } from "./dtos";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { buildAvatarUrl } from "./user.helper";

export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly authService: AuthenticationService
  ) {}

  async getMyProfile(userId: string, authId: string): Promise<MyProfileDto> {
    const [user, auth] = await Promise.all([
      this.userRepo.findById(userId),
      this.authService.findById(authId)
    ]);

    if (!user || !auth) {
      throw new NotFoundError(
        "user:errors.notFound",
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    return toMyProfileDto(
      user,
      auth.email,
      buildAvatarUrl(user.avatar ?? null)
    );
  }

  async updateMyProfile(
    userId: string,
    authId: string,
    data: Partial<UpdateProfileData>
  ): Promise<MyProfileDto> {
    const [user, auth] = await Promise.all([
      this.userRepo.updateById(userId, data),
      this.authService.findById(authId)
    ]);

    if (!user || !auth) {
      throw new NotFoundError(
        "user:errors.notFound",
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    return toMyProfileDto(
      user,
      auth.email,
      buildAvatarUrl(user.avatar ?? null)
    );
  }

  async updateAvatar(
    userId: string,
    filePath?: string
  ): Promise<UploadAvatarDto> {
    if (!filePath) {
      throw new BadRequestError(
        "user:errors.noFileUploaded",
        ERROR_CODES.USER_NO_FILE_UPLOADED
      );
    }

    const normalizedPath = path
      .relative(process.cwd(), filePath)
      .replace(/\\/g, "/");

    await this.userRepo.updateAvatar(userId, normalizedPath);

    return toUploadAvatarDto(buildAvatarUrl(normalizedPath) as string);
  }

  async getPublicProfile(userId: string): Promise<PublicProfileDto> {
    const user = await this.userRepo.findPublicById(userId);

    if (!user) {
      throw new NotFoundError(
        "user:errors.notFound",
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    return toPublicProfileDto(user, buildAvatarUrl(user.avatar ?? null));
  }

  async createProfile(
    data: CreateUserData,
    session?: ClientSession
  ): Promise<UserRecord> {
    return this.userRepo.createProfile(data, session);
  }
}
