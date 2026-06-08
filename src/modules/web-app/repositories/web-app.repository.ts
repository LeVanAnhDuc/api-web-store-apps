// types
import type { FilterQuery } from "mongoose";
import type {
  WebAppDocument,
  WebAppCreateInput,
  WebAppWithCategory,
  WebAppCategoryDocument
} from "../types";
// models
import WebAppModel from "@/models/web-app";
// common
import { ConflictRequestError } from "@/common/exceptions";
// others
import { asyncDatabaseHandler } from "@/utils/async-handler";
import { isDuplicateKeyError, getDuplicatedField } from "@/utils/mongo-errors";
import { ERROR_CODES } from "@/constants/error-code";

export type WebAppRepository = {
  findAll(filter: FilterQuery<WebAppDocument>): Promise<WebAppDocument[]>;
  existsByName(name: string): Promise<boolean>;
  create(data: WebAppCreateInput): Promise<WebAppDocument>;
  findActivePaginated(
    filter: FilterQuery<WebAppDocument>,
    options: { skip: number; limit: number }
  ): Promise<WebAppWithCategory[]>;
  countActive(filter: FilterQuery<WebAppDocument>): Promise<number>;
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

  async findActivePaginated(
    filter: FilterQuery<WebAppDocument>,
    { skip, limit }: { skip: number; limit: number }
  ): Promise<WebAppWithCategory[]> {
    return asyncDatabaseHandler("findActivePaginated", () =>
      WebAppModel.find(filter)
        .sort({ sortOrder: 1, displayName: 1 })
        .skip(skip)
        .limit(limit)
        .populate<{ category: WebAppCategoryDocument | null }>({
          path: "category",
          select: "displayName"
        })
        .lean<WebAppWithCategory[]>()
        .exec()
    );
  }

  async countActive(filter: FilterQuery<WebAppDocument>): Promise<number> {
    return asyncDatabaseHandler("countActive", () =>
      WebAppModel.countDocuments(filter).exec()
    );
  }

  async existsByName(name: string): Promise<boolean> {
    return asyncDatabaseHandler("existsByName", async () => {
      const found = await WebAppModel.exists({ name });
      return found !== null;
    });
  }

  async create(data: WebAppCreateInput): Promise<WebAppDocument> {
    return asyncDatabaseHandler("create", async () => {
      try {
        const doc = await WebAppModel.create(data);
        return doc.toObject<WebAppDocument>();
      } catch (err) {
        if (isDuplicateKeyError(err) && getDuplicatedField(err) === "name") {
          throw new ConflictRequestError({
            i18nMessage: (t) => t("webApp:errors.nameExists"),
            code: ERROR_CODES.WEB_APP_NAME_EXISTS
          });
        }
        throw err;
      }
    });
  }
}
