import { Types } from "mongoose";
import type { FilterQuery } from "mongoose";
import type {
  ContactDocument,
  ContactStatus
} from "@/types/modules/contact-admin";
import ContactModel from "@/models/contact";
import MongoDBRepository from "@/core/implements/MongoDBRepository";

interface PaginationOptions {
  skip: number;
  limit: number;
  sort: Record<string, 1 | -1>;
}

export class ContactRepository {
  private readonly db = new MongoDBRepository<ContactDocument>(
    ContactModel,
    "ContactRepository"
  );

  async create(data: Partial<ContactDocument>): Promise<ContactDocument> {
    return this.db.create(data);
  }

  async ticketExists(ticketNumber: string): Promise<boolean> {
    return this.db.exists({ ticketNumber });
  }

  async findAll(
    filter: FilterQuery<ContactDocument>,
    options: PaginationOptions
  ): Promise<{ data: ContactDocument[]; total: number }> {
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
  }

  async findById(id: string): Promise<ContactDocument | null> {
    return this.db.findById(id);
  }

  async updateStatus(
    id: string,
    status: ContactStatus
  ): Promise<ContactDocument | null> {
    return this.db.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  }

  async findByUser(
    userId: string,
    options: PaginationOptions
  ): Promise<{ data: ContactDocument[]; total: number }> {
    const filter: FilterQuery<ContactDocument> = {
      userId: new Types.ObjectId(userId)
    };

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
  }
}
