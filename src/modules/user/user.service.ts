// libs
import path from "path";
// types
import type {
  CreateUserData,
  UserRecord,
  UpdateProfileData
} from "@/types/modules/user";
import type { UserRepository } from "./repositories/user.repository";
import type { MyProfileDto, PublicProfileDto, UploadAvatarDto } from "./dtos";
// config
import { BadRequestError, NotFoundError } from "@/config/responses/error";
// dtos
import { toMyProfileDto, toPublicProfileDto, toUploadAvatarDto } from "./dtos";
// others
import { buildAvatarUrl } from "./user.helper";

export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async getMyProfile(userId: string, email: string): Promise<MyProfileDto> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError("user:errors.notFound");
    }

    return toMyProfileDto(user, email, buildAvatarUrl(user.avatar ?? null));
  }

  async updateMyProfile(
    userId: string,
    email: string,
    data: Partial<UpdateProfileData>
  ): Promise<MyProfileDto> {
    const user = await this.userRepo.updateById(userId, data);

    if (!user) {
      throw new NotFoundError("user:errors.notFound");
    }

    return toMyProfileDto(user, email, buildAvatarUrl(user.avatar ?? null));
  }

  async updateAvatar(
    userId: string,
    filePath?: string
  ): Promise<UploadAvatarDto> {
    if (!filePath) {
      throw new BadRequestError(
        "user:errors.noFileUploaded",
        "NO_FILE_UPLOADED"
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
      throw new NotFoundError("user:errors.notFound");
    }

    return toPublicProfileDto(user, buildAvatarUrl(user.avatar ?? null));
  }

  async createProfile(data: CreateUserData): Promise<UserRecord> {
    return this.userRepo.createProfile(data);
  }
}
