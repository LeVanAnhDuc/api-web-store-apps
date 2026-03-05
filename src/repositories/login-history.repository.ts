import type { FilterQuery } from "mongoose";
import type {
  CreateLoginHistoryData,
  LoginHistoryDocument
} from "@/types/modules/login-history";
import LoginHistoryModel from "@/models/login-history";
import MongoDBRepository from "@/core/implements/MongoDBRepository";

interface PaginationOptions {
  skip: number;
  limit: number;
  sort: Record<string, 1 | -1>;
}

export class LoginHistoryRepository {
  private readonly db = new MongoDBRepository<LoginHistoryDocument>(
    LoginHistoryModel,
    "LoginHistoryRepository"
  );

  async create(data: CreateLoginHistoryData): Promise<LoginHistoryDocument> {
    return this.db.create(data as Partial<LoginHistoryDocument>);
  }

  async findByUser(
    userId: string,
    filter: FilterQuery<LoginHistoryDocument>,
    options: PaginationOptions
  ): Promise<{ data: LoginHistoryDocument[]; total: number }> {
    const [data, total] = await Promise.all([
      LoginHistoryModel.find(filter)
        .skip(options.skip)
        .limit(options.limit)
        .sort(options.sort)
        .lean()
        .exec(),
      LoginHistoryModel.countDocuments(filter).exec()
    ]);

    return { data: data as unknown as LoginHistoryDocument[], total };
  }

  async findAll(
    filter: FilterQuery<LoginHistoryDocument>,
    options: PaginationOptions
  ): Promise<{ data: LoginHistoryDocument[]; total: number }> {
    const [data, total] = await Promise.all([
      LoginHistoryModel.find(filter)
        .skip(options.skip)
        .limit(options.limit)
        .sort(options.sort)
        .lean()
        .exec(),
      LoginHistoryModel.countDocuments(filter).exec()
    ]);

    return { data: data as unknown as LoginHistoryDocument[], total };
  }
}
