import type {
  UserDocument,
  CreateUserData,
  UserRecord,
  UpdateProfileData,
  PublicUserRecord
} from "@/types/modules/user";
import UserModel from "@/models/user";
import { asyncDatabaseHandler } from "@/utils/async-handler";

export type UserRepository = {
  createProfile(data: CreateUserData): Promise<UserRecord>;
  findById(userId: string): Promise<UserDocument | null>;
  updateById(
    userId: string,
    data: Partial<UpdateProfileData>
  ): Promise<UserDocument | null>;
  updateAvatar(userId: string, avatarPath: string): Promise<void>;
  findPublicById(userId: string): Promise<PublicUserRecord | null>;
};

export class MongoUserRepository implements UserRepository {
  async createProfile(data: CreateUserData): Promise<UserRecord> {
    return asyncDatabaseHandler("createProfile", async () => {
      const user = await UserModel.create({
        authId: data.authId,
        fullName: data.fullName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth
      });

      return { _id: user._id, fullName: user.fullName };
    });
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return asyncDatabaseHandler("findById", () =>
      UserModel.findById(userId)
        .select("fullName phone avatar address dateOfBirth gender createdAt")
        .lean<UserDocument>()
        .exec()
    );
  }

  async updateById(
    userId: string,
    data: Partial<UpdateProfileData>
  ): Promise<UserDocument | null> {
    return asyncDatabaseHandler("updateById", () =>
      UserModel.findByIdAndUpdate(userId, { $set: data }, { new: true })
        .select("fullName phone avatar address dateOfBirth gender createdAt")
        .lean<UserDocument>()
        .exec()
    );
  }

  async updateAvatar(userId: string, avatarPath: string): Promise<void> {
    await asyncDatabaseHandler("updateAvatar", () =>
      UserModel.updateOne({ _id: userId }, { $set: { avatar: avatarPath } })
    );
  }

  async findPublicById(userId: string): Promise<PublicUserRecord | null> {
    return asyncDatabaseHandler("findPublicById", () =>
      UserModel.findById(userId)
        .select("fullName avatar gender")
        .lean<PublicUserRecord>()
        .exec()
    );
  }
}
