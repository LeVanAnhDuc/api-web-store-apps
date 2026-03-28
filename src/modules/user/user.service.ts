import path from "path";
import type { UserRepository } from "./repositories/user.repository";
import type {
  UserDocument,
  CreateUserData,
  UserRecord,
  UpdateProfileData,
  MyProfileResponse,
  PublicProfileResponse,
  UploadAvatarResponse
} from "@/types/modules/user";
import { NotFoundError } from "@/config/responses/error";
import { USER_CONFIG } from "@/constants/config";

export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async getMyProfile(
    userId: string,
    email: string
  ): Promise<MyProfileResponse> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError("user:errors.notFound");
    }

    return {
      _id: String(user._id),
      fullName: user.fullName,
      phone: user.phone ?? null,
      avatar: this.buildAvatarUrl(user.avatar ?? null),
      address: user.address ?? null,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
      gender: user.gender ?? null,
      email,
      createdAt: user.createdAt.toISOString()
    };
  }

  async updateMyProfile(
    userId: string,
    email: string,
    data: Partial<UpdateProfileData>
  ): Promise<MyProfileResponse> {
    const user = await this.userRepo.updateById(userId, data);

    if (!user) {
      throw new NotFoundError("user:errors.notFound");
    }

    return {
      _id: String(user._id),
      fullName: user.fullName,
      phone: user.phone ?? null,
      avatar: this.buildAvatarUrl(user.avatar ?? null),
      address: user.address ?? null,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
      gender: user.gender ?? null,
      email,
      createdAt: user.createdAt.toISOString()
    };
  }

  async updateAvatar(
    userId: string,
    filePath: string
  ): Promise<UploadAvatarResponse> {
    const normalizedPath = path
      .relative(process.cwd(), filePath)
      .replace(/\\/g, "/");

    await this.userRepo.updateAvatar(userId, normalizedPath);

    return {
      avatarUrl: this.buildAvatarUrl(normalizedPath) as string
    };
  }

  async getPublicProfile(userId: string): Promise<PublicProfileResponse> {
    const user = await this.userRepo.findPublicById(userId);

    if (!user) {
      throw new NotFoundError("user:errors.notFound");
    }

    return {
      _id: String(user._id),
      fullName: user.fullName,
      avatar: this.buildAvatarUrl(user.avatar ?? null),
      gender: user.gender ?? null
    };
  }

  async findByAuthId(authId: string): Promise<{
    _id: UserDocument["_id"];
    fullName: string;
    avatar?: string | null;
  } | null> {
    return this.userRepo.findByAuthId(authId);
  }

  async createProfile(data: CreateUserData): Promise<UserRecord> {
    return this.userRepo.createProfile(data);
  }

  private buildAvatarUrl(avatarPath: string | null): string | null {
    if (!avatarPath) return null;
    return `${USER_CONFIG.BASE_URL}/${avatarPath}`;
  }
}
