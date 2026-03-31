// types
import type {
  AuthenticationDocument,
  AuthenticationRecord,
  CreateAuthenticationData
} from "@/types/modules/authentication";
import type { UserDocument } from "@/types/modules/user";
// models
import AuthenticationModel from "@/models/authentication";
import UserModel from "@/models/user";
// others
import { AUTHENTICATION_ROLES } from "@/constants/modules/authentication";
import { asyncDatabaseHandler } from "@/utils/async-handler";

export type AuthenticationRepository = {
  findByEmail(email: string): Promise<AuthenticationDocument | null>;
  findById(authId: string): Promise<AuthenticationDocument | null>;
  emailExists(email: string): Promise<boolean>;
  create(data: CreateAuthenticationData): Promise<AuthenticationRecord>;
  storeTempPassword(
    authId: string,
    tempPasswordHash: string,
    tempPasswordExpAt: Date
  ): Promise<void>;
  markTempPasswordUsed(authId: string): Promise<void>;
  updatePassword(authId: string, hashedPassword: string): Promise<void>;
  findUserByAuthId(authId: string): Promise<{
    _id: UserDocument["_id"];
    fullName: string;
    avatar?: string | null;
  } | null>;
};

export class MongoAuthenticationRepository implements AuthenticationRepository {
  async findByEmail(email: string): Promise<AuthenticationDocument | null> {
    return asyncDatabaseHandler("findByEmail", () =>
      AuthenticationModel.findOne({ email })
        .lean<AuthenticationDocument>()
        .exec()
    );
  }

  async findById(authId: string): Promise<AuthenticationDocument | null> {
    return asyncDatabaseHandler("findById", () =>
      AuthenticationModel.findById(authId).lean<AuthenticationDocument>().exec()
    );
  }

  async emailExists(email: string): Promise<boolean> {
    return asyncDatabaseHandler(
      "emailExists",
      async () => !!(await AuthenticationModel.exists({ email }))
    );
  }

  async create(data: CreateAuthenticationData): Promise<AuthenticationRecord> {
    return asyncDatabaseHandler("create", async () => {
      const authentication = await AuthenticationModel.create({
        email: data.email,
        password: data.hashedPassword,
        verifiedEmail: true,
        roles: AUTHENTICATION_ROLES.USER,
        isActive: true
      });

      return {
        _id: authentication._id,
        email: authentication.email,
        roles: authentication.roles
      };
    });
  }

  async storeTempPassword(
    authId: string,
    tempPasswordHash: string,
    tempPasswordExpAt: Date
  ): Promise<void> {
    await asyncDatabaseHandler("storeTempPassword", () =>
      AuthenticationModel.findByIdAndUpdate(authId, {
        tempPasswordHash,
        tempPasswordExpAt,
        tempPasswordUsed: false,
        mustChangePassword: true
      }).exec()
    );
  }

  async markTempPasswordUsed(authId: string): Promise<void> {
    await asyncDatabaseHandler("markTempPasswordUsed", () =>
      AuthenticationModel.findByIdAndUpdate(authId, {
        tempPasswordUsed: true,
        mustChangePassword: true
      }).exec()
    );
  }

  async updatePassword(authId: string, hashedPassword: string): Promise<void> {
    await asyncDatabaseHandler("updatePassword", () =>
      AuthenticationModel.findByIdAndUpdate(authId, {
        password: hashedPassword,
        passwordChangedAt: new Date()
      }).exec()
    );
  }

  async findUserByAuthId(authId: string): Promise<{
    _id: UserDocument["_id"];
    fullName: string;
    avatar?: string | null;
  } | null> {
    return asyncDatabaseHandler("findUserByAuthId", () =>
      UserModel.findOne({ authId })
        .select("_id fullName avatar")
        .lean<{
          _id: UserDocument["_id"];
          fullName: string;
          avatar?: string | null;
        }>()
        .exec()
    );
  }
}
