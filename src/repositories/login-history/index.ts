import type {
  CreateLoginHistoryData,
  LoginHistoryDocument
} from "@/types/modules/login-history";
import LoginHistoryModel from "@/models/login-history";
import MongoDBRepository from "@/services/implements/MongoDBRepository";

class LoginHistoryRepository {
  constructor(private readonly db: MongoDBRepository<LoginHistoryDocument>) {}

  async create(data: CreateLoginHistoryData): Promise<LoginHistoryDocument> {
    return this.db.create(data as Partial<LoginHistoryDocument>);
  }
}

let instance: LoginHistoryRepository | null = null;

export const getLoginHistoryRepository = (): LoginHistoryRepository => {
  if (!instance) {
    const db = new MongoDBRepository<LoginHistoryDocument>(
      LoginHistoryModel,
      "LoginHistoryRepository"
    );
    instance = new LoginHistoryRepository(db);
  }
  return instance;
};

export default LoginHistoryRepository;
