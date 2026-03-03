import type { UserDocument } from "@/types/modules/user";
import type { CreateUserData, UserRecord } from "@/types/modules/user";
import UserModel from "@/models/user";
import MongoDBRepository from "@/services/implements/MongoDBRepository";

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
}
