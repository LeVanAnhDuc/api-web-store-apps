// types
import type {
  UserDocument,
  CreateUserData,
  UserRecord,
  UpdateProfileData,
  PublicUserRecord,
  UserWithAuth
} from "@/types/modules/user";
import type { AuthenticationDocument } from "@/types/modules/authentication";
import type { ClientSession } from "mongoose";
// models
import UserModel from "@/models/user";
// others
import { asyncDatabaseHandler } from "@/utils/async-handler";

export type UserRepository = {
  createProfile(
    data: CreateUserData,
    session?: ClientSession
  ): Promise<UserRecord>;
  findById(userId: string): Promise<UserDocument | null>;
  findByAuthId(authId: string): Promise<{
    _id: UserDocument["_id"];
    email: string;
    fullName: string;
    avatar?: string | null;
  } | null>;
  updateById(
    userId: string,
    data: Partial<UpdateProfileData>
  ): Promise<UserDocument | null>;
  updateAvatar(userId: string, avatarPath: string): Promise<void>;
  findPublicById(userId: string): Promise<PublicUserRecord | null>;
  emailExists(email: string): Promise<boolean>;
  findByEmailWithAuth(email: string): Promise<UserWithAuth | null>;
};

export class MongoUserRepository implements UserRepository {
  async createProfile(
    data: CreateUserData,
    session?: ClientSession
  ): Promise<UserRecord> {
    return asyncDatabaseHandler("createProfile", async () => {
      const [user] = await UserModel.create(
        [
          {
            authId: data.authId,
            email: data.email,
            fullName: data.fullName,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth
          }
        ],
        { session }
      );

      return { _id: user._id, email: user.email, fullName: user.fullName };
    });
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return asyncDatabaseHandler("findById", () =>
      UserModel.findById(userId)
        .select(
          "email fullName phone avatar address dateOfBirth gender createdAt"
        )
        .lean<UserDocument>()
        .exec()
    );
  }

  async findByAuthId(authId: string): Promise<{
    _id: UserDocument["_id"];
    email: string;
    fullName: string;
    avatar?: string | null;
  } | null> {
    return asyncDatabaseHandler("findByAuthId", () =>
      UserModel.findOne({ authId })
        .select("_id email fullName avatar")
        .lean<{
          _id: UserDocument["_id"];
          email: string;
          fullName: string;
          avatar?: string | null;
        }>()
        .exec()
    );
  }

  async updateById(
    userId: string,
    data: Partial<UpdateProfileData>
  ): Promise<UserDocument | null> {
    return asyncDatabaseHandler("updateById", () =>
      UserModel.findByIdAndUpdate(userId, { $set: data }, { new: true })
        .select(
          "email fullName phone avatar address dateOfBirth gender createdAt"
        )
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

  async emailExists(email: string): Promise<boolean> {
    return asyncDatabaseHandler(
      "emailExists",
      async () => !!(await UserModel.exists({ email }))
    );
  }

  async findByEmailWithAuth(email: string): Promise<UserWithAuth | null> {
    return asyncDatabaseHandler("findByEmailWithAuth", async () => {
      type Joined = UserDocument & { auth: AuthenticationDocument };

      const [result] = await UserModel.aggregate<Joined>([
        { $match: { email } },
        {
          $lookup: {
            from: "auths",
            localField: "authId",
            foreignField: "_id",
            as: "auth"
          }
        },
        { $unwind: "$auth" },
        { $limit: 1 }
      ]).exec();

      if (!result) return null;

      const { auth, ...user } = result;
      return { user: user as UserDocument, auth };
    });
  }
}
