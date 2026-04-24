// types
import type { FilterQuery } from "mongoose";
import type { ContactDocument, ContactStatus } from "./types";
// models
import ContactModel from "@/models/contact";
// others
import { asyncDatabaseHandler } from "@/utils/async-handler";

interface PaginationOptions {
  skip: number;
  limit: number;
  sort: Record<string, 1 | -1>;
}

export type ContactRepository = {
  create(data: Partial<ContactDocument>): Promise<ContactDocument>;
  findAll(
    filter: FilterQuery<ContactDocument>,
    options: PaginationOptions
  ): Promise<{ data: ContactDocument[]; total: number }>;
  findById(id: string): Promise<ContactDocument | null>;
  updateStatus(
    id: string,
    status: ContactStatus
  ): Promise<ContactDocument | null>;
};

export class MongoContactRepository implements ContactRepository {
  async create(data: Partial<ContactDocument>): Promise<ContactDocument> {
    return asyncDatabaseHandler("create", async () => {
      const doc = await ContactModel.create(data);
      return doc as unknown as ContactDocument;
    });
  }

  async findAll(
    filter: FilterQuery<ContactDocument>,
    options: PaginationOptions
  ): Promise<{ data: ContactDocument[]; total: number }> {
    return asyncDatabaseHandler("findAll", async () => {
      const [data, total] = await Promise.all([
        ContactModel.find(filter)
          .skip(options.skip)
          .limit(options.limit)
          .sort(options.sort)
          .lean()
          .exec(),
        ContactModel.countDocuments(filter).exec()
      ]);

      return { data: data as unknown as ContactDocument[], total };
    });
  }

  async findById(id: string): Promise<ContactDocument | null> {
    return asyncDatabaseHandler("findById", () =>
      ContactModel.findById(id).lean<ContactDocument>().exec()
    );
  }

  async updateStatus(
    id: string,
    status: ContactStatus
  ): Promise<ContactDocument | null> {
    return asyncDatabaseHandler("updateStatus", () =>
      ContactModel.findByIdAndUpdate(id, { $set: { status } }, { new: true })
        .lean<ContactDocument>()
        .exec()
    );
  }
}
