import type {
  CreateLoginHistoryData,
  LoginHistoryDocument
} from "@/types/modules/login-history";
import LoginHistoryModel from "@/models/login-history";
import MongoDBRepository from "@/core/implements/MongoDBRepository";

export class LoginHistoryRepository {
  private readonly db = new MongoDBRepository<LoginHistoryDocument>(
    LoginHistoryModel,
    "LoginHistoryRepository"
  );

  async create(data: CreateLoginHistoryData): Promise<LoginHistoryDocument> {
    return this.db.create(data as Partial<LoginHistoryDocument>);
  }
}
