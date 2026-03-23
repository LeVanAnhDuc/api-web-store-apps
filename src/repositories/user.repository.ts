import type {
  UserDocument,
  CreateUserData,
  UserRecord,
  UpdateProfileData,
  PublicUserRecord
} from "@/types/modules/user";
import UserModel from "@/models/user";
import MongoDBRepository from "@/core/implements/MongoDBRepository";

export class UserRepository {
  private readonly db = new MongoDBRepository<UserDocument>(
    UserModel,
    "UserRepository"
  );

  async createProfile(data: CreateUserData): Promise<UserRecord> {
    const user = await this.db.create({
      authId: data.authId,
      fullName: data.fullName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth
    });

    return {
      _id: user._id,
      fullName: user.fullName
    };
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.db.findById(userId, { lean: true });
  }

  async updateById(
    userId: string,
    data: Partial<UpdateProfileData>
  ): Promise<UserDocument | null> {
    return this.db.findByIdAndUpdate(userId, { $set: data }, { new: true });
  }

  async updateAvatar(userId: string, avatarPath: string): Promise<void> {
    await this.db.findByIdAndUpdate(userId, { $set: { avatar: avatarPath } });
  }

  async findPublicById(userId: string): Promise<PublicUserRecord | null> {
    return UserModel.findById(userId)
      .select("fullName avatar gender")
      .lean<PublicUserRecord>()
      .exec();
  }

  async findByAuthId(
    authId: string
  ): Promise<{ fullName: string; avatar?: string | null } | null> {
    return UserModel.findOne({ authId })
      .select("fullName avatar")
      .lean<{ fullName: string; avatar?: string | null }>()
      .exec();
  }
}
