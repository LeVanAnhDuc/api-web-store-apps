import type {
  AuthenticationDocument,
  AuthenticationRecord,
  CreateAuthenticationData
} from "@/types/modules/authentication";
import { AUTHENTICATION_ROLES } from "@/constants/enums";
import AuthenticationModel from "@/models/authentication";
import type { RedisClientType } from "redis";
import MongoDBRepository from "@/services/implements/MongoDBRepository";
import RedisCache from "@/services/implements/RedisCache";
import { instanceRedis } from "@/database/redis";

class AuthenticationRepository {
  private readonly db = new MongoDBRepository<AuthenticationDocument>(
    AuthenticationModel,
    "AuthenticationRepository"
  );
  private readonly cache = new RedisCache(
    instanceRedis.getClient() as RedisClientType,
    "AuthenticationCache"
  );

  async findByEmail(email: string): Promise<AuthenticationDocument | null> {
    return this.db.findOne({ email }, { lean: true });
  }

  async findById(authId: string): Promise<AuthenticationDocument | null> {
    return this.db.findById(authId, { lean: true });
  }

  async emailExists(email: string): Promise<boolean> {
    return this.db.exists({ email });
  }

  async create(data: CreateAuthenticationData): Promise<AuthenticationRecord> {
    const authentication = await this.db.create({
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
  }

  async storeTempPassword(
    authId: string,
    tempPasswordHash: string,
    tempPasswordExpAt: Date
  ): Promise<void> {
    await this.db.findByIdAndUpdate(authId, {
      tempPasswordHash,
      tempPasswordExpAt,
      tempPasswordUsed: false,
      mustChangePassword: true
    });
  }

  async markTempPasswordUsed(authId: string): Promise<void> {
    await this.db.findByIdAndUpdate(authId, {
      tempPasswordUsed: true,
      mustChangePassword: true
    });
  }
}

export default new AuthenticationRepository();
