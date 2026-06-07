// types
import type { FilterQuery } from "mongoose";
import type { WebAppDocument } from "../types";
// models
import WebAppModel from "@/models/web-app";
// others
import { asyncDatabaseHandler } from "@/utils/async-handler";

export type WebAppRepository = {
  findAll(filter: FilterQuery<WebAppDocument>): Promise<WebAppDocument[]>;
};

export class MongoWebAppRepository implements WebAppRepository {
  async findAll(
    filter: FilterQuery<WebAppDocument>
  ): Promise<WebAppDocument[]> {
    return asyncDatabaseHandler("findAll", () =>
      WebAppModel.find(filter)
        .sort({ sortOrder: 1, displayName: 1 })
        .lean<WebAppDocument[]>()
        .exec()
    );
  }
}
