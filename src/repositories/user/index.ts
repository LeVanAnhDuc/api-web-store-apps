import type { UserDocument } from "@/types/modules/user";
import type { CreateUserData, UserRecord } from "@/types/modules/user";
import UserModel from "@/modules/user/model";
import type { RedisClientType } from "redis";
import MongoDBRepository from "@/services/implements/MongoDBRepository";
import RedisCache from "@/services/implements/RedisCache";
import { instanceRedis } from "@/database/redis";

class UserRepository {
  constructor(
    private readonly db: MongoDBRepository<UserDocument>,
    private readonly cache: RedisCache
  ) {}

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

let instance: UserRepository | null = null;

export const getUserRepository = (): UserRepository => {
  if (!instance) {
    const db = new MongoDBRepository<UserDocument>(UserModel, "UserRepository");
    const cache = new RedisCache(
      instanceRedis.getClient() as RedisClientType,
      "UserCache"
    );
    instance = new UserRepository(db, cache);
  }
  return instance;
};

export default UserRepository;
