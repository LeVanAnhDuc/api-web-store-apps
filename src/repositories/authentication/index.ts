import type {
  AuthenticationDocument,
  AuthenticationRecord,
  CreateAuthenticationData
} from "@/types/modules/authentication";
import { AUTHENTICATION_ROLES } from "@/modules/authentication/constants";
import AuthenticationModel from "@/modules/authentication/model";
import type { RedisClientType } from "redis";
import MongoDBRepository from "@/services/implements/MongoDBRepository";
import RedisCache from "@/services/implements/RedisCache";
import { instanceRedis } from "@/database/redis";

class AuthenticationRepository {
  constructor(
    private readonly db: MongoDBRepository<AuthenticationDocument>,
    private readonly cache: RedisCache
  ) {}

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

let instance: AuthenticationRepository | null = null;

export const getAuthenticationRepository = (): AuthenticationRepository => {
  if (!instance) {
    const db = new MongoDBRepository<AuthenticationDocument>(
      AuthenticationModel,
      "AuthenticationRepository"
    );
    const cache = new RedisCache(
      instanceRedis.getClient() as RedisClientType,
      "AuthenticationCache"
    );
    instance = new AuthenticationRepository(db, cache);
  }
  return instance;
};

export default AuthenticationRepository;
