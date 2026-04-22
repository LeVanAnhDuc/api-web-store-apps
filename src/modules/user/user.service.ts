// libs
import path from "path";
// types
import type {
  CreateUserData,
  UserDocument,
  UserRecord,
  UpdateProfileData,
  UserWithAuth
} from "@/modules/user/types";
import type { ClientSession } from "mongoose";
import type { UserRepository } from "./user.repository";
import type { MyProfileDto, PublicProfileDto, UploadAvatarDto } from "./dtos";
// config
import { BadRequestError, NotFoundError } from "@/config/responses/error";
// validators
import { validateEmail, validateObjectId } from "@/validators/utils";
// dtos
import { toMyProfileDto, toPublicProfileDto, toUploadAvatarDto } from "./dtos";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";
// helpers
import { buildAvatarUrl } from "./helpers";

export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async getMyProfile(userId: string): Promise<MyProfileDto> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError(
        "user:errors.notFound",
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    return toMyProfileDto(user, buildAvatarUrl(user.avatar ?? null));
  }

  async updateMyProfile(
    userId: string,
    data: Partial<UpdateProfileData>
  ): Promise<MyProfileDto> {
    const user = await this.userRepo.updateById(userId, data);

    if (!user) {
      throw new NotFoundError(
        "user:errors.notFound",
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    return toMyProfileDto(user, buildAvatarUrl(user.avatar ?? null));
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

  async emailExists(email: string): Promise<boolean> {
    validateEmail(email);

    try {
      return await this.userRepo.emailExists(email);
    } catch (error) {
      Logger.error("Failed to check email existence", { email, error });
      throw error;
    }
  }

  async findByEmailWithAuth(email: string): Promise<UserWithAuth | null> {
    validateEmail(email);

    try {
      return await this.userRepo.findByEmailWithAuth(email);
    } catch (error) {
      Logger.error("Failed to find auth by email", { email, error });
      throw error;
    }
  }

  async findByAuthId(authId: string): Promise<{
    _id: UserDocument["_id"];
    email: string;
    fullName: string;
    avatar?: string | null;
  } | null> {
    validateObjectId(authId, "authId");

    try {
      return await this.userRepo.findByAuthId(authId);
    } catch (error) {
      Logger.error("Failed to find user by auth ID", { authId, error });
      throw error;
    }
  }
}
