import type { ContactDocument } from "@/types/modules/contact-admin";
import ContactModel from "@/models/contact";
import MongoDBRepository from "@/core/implements/MongoDBRepository";

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
}
