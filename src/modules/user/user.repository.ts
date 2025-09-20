// types
import type { IUserCreation, IUserDocument } from "@/types/modules/user";
// models
import UserModel from "./user.model";
// repositories
import Repository from "@/repositories/base.repo";
// others
import CONSTANTS from "@/constants";

const { USER } = CONSTANTS.MODEL_NAME;

class UserRepository extends Repository<IUserDocument> {
  constructor() {
    super(UserModel, USER);
  }

  public createUser = async (object: IUserCreation) =>
    await this.create(object);
}

export default UserRepository;
