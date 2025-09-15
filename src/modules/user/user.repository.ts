// types
import type { IUserCreation, IUserDocument } from "@/types/modules/user";
// models
import UserModel from "./user.model";
// repositories
import Repository from "@/repositories/base.repo";

class UserRepository extends Repository<IUserDocument> {
  constructor() {
    super(UserModel, "User");
  }

  public createUser = async (object: IUserCreation) =>
    await this.create(object);
}

export default UserRepository;
