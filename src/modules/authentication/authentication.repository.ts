// types
import type {
  AuthenticationDocument,
  AuthenticationRecord,
  CreateAuthenticationData
} from "@/modules/authentication/types";
import type { ClientSession } from "mongoose";
// models
import AuthenticationModel from "@/models/authentication";
// modules
import { AUTHENTICATION_ROLES } from "@/modules/authentication/constants";
// others
import { asyncDatabaseHandler } from "@/utils/async-handler";

export type AuthenticationRepository = {
  findById(authId: string): Promise<AuthenticationDocument | null>;
  create(
    data: CreateAuthenticationData,
    session?: ClientSession
  ): Promise<AuthenticationRecord>;
  storeTempPassword(
    authId: string,
    tempPasswordHash: string,
    tempPasswordExpAt: Date
  ): Promise<void>;
  markTempPasswordUsed(authId: string): Promise<void>;
  updatePassword(
    authId: string,
    hashedPassword: string,
    session?: ClientSession
  ): Promise<void>;
};

export class MongoAuthenticationRepository implements AuthenticationRepository {
  async findById(authId: string): Promise<AuthenticationDocument | null> {
    return asyncDatabaseHandler("findById", () =>
      AuthenticationModel.findById(authId).lean<AuthenticationDocument>().exec()
    );
  }

  async create(
    data: CreateAuthenticationData,
    session?: ClientSession
  ): Promise<AuthenticationRecord> {
    return asyncDatabaseHandler("create", async () => {
      const [authentication] = await AuthenticationModel.create(
        [
          {
            password: data.hashedPassword,
            verifiedEmail: true,
            roles: AUTHENTICATION_ROLES.USER,
            isActive: true
          }
        ],
        { session }
      );

      return {
        _id: authentication._id,
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

  async updatePassword(
    authId: string,
    hashedPassword: string,
    session?: ClientSession
  ): Promise<void> {
    await asyncDatabaseHandler("updatePassword", () =>
      AuthenticationModel.findByIdAndUpdate(
        authId,
        {
          password: hashedPassword,
          passwordChangedAt: new Date()
        },
        { session }
      ).exec()
    );
  }
}
