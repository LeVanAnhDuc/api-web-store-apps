import type { UserDocument } from "@/types/modules/user";
import type { CreateUserData, UserRecord } from "@/types/modules/user";
import UserModel from "@/models/user";
import type { RedisClientType } from "redis";
import MongoDBRepository from "@/services/implements/MongoDBRepository";
import RedisCache from "@/services/implements/RedisCache";
import { instanceRedis } from "@/database/redis";

class UserRepository {
  private readonly db = new MongoDBRepository<UserDocument>(
    UserModel,
    "UserRepository"
  );
  private readonly cache = new RedisCache(
    instanceRedis.getClient() as RedisClientType,
    "UserCache"
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
}

export default new UserRepository();
