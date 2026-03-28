import { Types } from "mongoose";
import type { FilterQuery } from "mongoose";
import type {
  CreateLoginHistoryData,
  LoginHistoryDocument
} from "@/types/modules/login-history";
import LoginHistoryModel from "@/models/login-history";
import { asyncDatabaseHandler } from "@/utils/async-handler";

export type LoginHistoryFilter = {
  userId?: string;
  status?: string;
  method?: string;
  deviceType?: string;
  clientType?: string;
  country?: string;
  city?: string;
  os?: string;
  browser?: string;
  ip?: string;
  fromDate?: Date;
  toDate?: Date;
};

type PaginationOptions = {
  skip: number;
  limit: number;
  sort: Record<string, 1 | -1>;
};

export type LoginHistoryRepository = {
  create(data: CreateLoginHistoryData): Promise<LoginHistoryDocument>;
  findByUser(
    filter: LoginHistoryFilter,
    options: PaginationOptions
  ): Promise<{ data: LoginHistoryDocument[]; total: number }>;
  findAll(
    filter: LoginHistoryFilter,
    options: PaginationOptions
  ): Promise<{ data: LoginHistoryDocument[]; total: number }>;
};

export class MongoLoginHistoryRepository implements LoginHistoryRepository {
  async create(data: CreateLoginHistoryData): Promise<LoginHistoryDocument> {
    return asyncDatabaseHandler("create", async () => {
      const doc = await LoginHistoryModel.create(data);
      return doc as unknown as LoginHistoryDocument;
    });
  }

  async findByUser(
    filter: LoginHistoryFilter,
    options: PaginationOptions
  ): Promise<{ data: LoginHistoryDocument[]; total: number }> {
    return asyncDatabaseHandler("findByUser", async () => {
      const mongoFilter = this.toMongoFilter(filter);
      const [data, total] = await Promise.all([
        LoginHistoryModel.find(mongoFilter)
          .skip(options.skip)
          .limit(options.limit)
          .sort(options.sort)
          .lean()
          .exec(),
        LoginHistoryModel.countDocuments(mongoFilter).exec()
      ]);

      return { data: data as unknown as LoginHistoryDocument[], total };
    });
  }

  async findAll(
    filter: LoginHistoryFilter,
    options: PaginationOptions
  ): Promise<{ data: LoginHistoryDocument[]; total: number }> {
    return asyncDatabaseHandler("findAll", async () => {
      const mongoFilter = this.toMongoFilter(filter);
      const [data, total] = await Promise.all([
        LoginHistoryModel.find(mongoFilter)
          .skip(options.skip)
          .limit(options.limit)
          .sort(options.sort)
          .lean()
          .exec(),
        LoginHistoryModel.countDocuments(mongoFilter).exec()
      ]);

      return { data: data as unknown as LoginHistoryDocument[], total };
    });
  }

  private toMongoFilter(
    filter: LoginHistoryFilter
  ): FilterQuery<LoginHistoryDocument> {
    const mongo: FilterQuery<LoginHistoryDocument> = {};

    if (filter.userId) mongo.userId = new Types.ObjectId(filter.userId);
    if (filter.status) mongo.status = filter.status;
    if (filter.method) mongo.method = filter.method;
    if (filter.deviceType) mongo.deviceType = filter.deviceType;
    if (filter.clientType) mongo.clientType = filter.clientType;
    if (filter.country)
      mongo.country = { $regex: filter.country, $options: "i" };
    if (filter.city) mongo.city = { $regex: filter.city, $options: "i" };
    if (filter.os) mongo.os = { $regex: filter.os, $options: "i" };
    if (filter.browser)
      mongo.browser = { $regex: filter.browser, $options: "i" };
    if (filter.ip) mongo.ip = { $regex: filter.ip, $options: "i" };
    if (filter.fromDate || filter.toDate) {
      mongo.createdAt = {};
      if (filter.fromDate) mongo.createdAt.$gte = filter.fromDate;
      if (filter.toDate) mongo.createdAt.$lte = filter.toDate;
    }

    return mongo;
  }
}
