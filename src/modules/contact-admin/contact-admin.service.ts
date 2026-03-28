import type {
  SubmitContactBody,
  AdminContactsQuery,
  ContactListItem,
  ContactDetailItem as ContactDetailItemType,
  PaginatedResult,
  ContactDocument,
  ContactStatus
} from "@/types/modules/contact-admin";
import type { HandlerResult } from "@/types/http";
import type { ContactRepository } from "./repositories/contact.repository";
import type { SubmitContactResponseDto } from "./dto/submit-contact.dto";
import { toSubmitContactResponseDto } from "./dto/submit-contact.dto";
import { CONTACT_STATUSES } from "@/constants/modules/contact-admin";
import { NotFoundError } from "@/config/responses/error";
import { buildContactFilter } from "./contact-admin.helper";
// validators
import { sanitizeText, validateStringLength } from "@/validators/utils";
import { CONTACT_CONFIG } from "@/validators/constants";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class ContactAdminService {
  constructor(private readonly contactRepo: ContactRepository) {}

  async submitContact(
    body: SubmitContactBody
  ): Promise<HandlerResult<SubmitContactResponseDto>> {
    const { message, subject, email } = body;

    const sanitizedSubject = sanitizeText(subject);
    const sanitizedMessage = sanitizeText(message);

    validateStringLength(
      sanitizedSubject,
      "subject",
      CONTACT_CONFIG.SUBJECT_MIN_LENGTH,
      CONTACT_CONFIG.SUBJECT_MAX_LENGTH
    );
    validateStringLength(
      sanitizedMessage,
      "message",
      CONTACT_CONFIG.MESSAGE_MIN_LENGTH,
      CONTACT_CONFIG.MESSAGE_MAX_LENGTH
    );

    const contact = await this.contactRepo.create({
      email,
      subject,
      message,
      status: CONTACT_STATUSES.NEW
    });

    return {
      data: toSubmitContactResponseDto(contact),
      message: "contactAdmin:success.submitted"
    };
  }

  async getContactList(
    query: AdminContactsQuery
  ): Promise<PaginatedResult<ContactListItem>> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? "createdAt";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;

    const filter = buildContactFilter(query);
    const { data, total } = await this.contactRepo.findAll(filter, {
      skip,
      limit,
      sort: { [sortBy]: sortOrder }
    });

    return {
      items: data.map((doc) => this.mapToContactListItem(doc)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getContactDetail(id: string): Promise<ContactDetailItemType> {
    const doc = await this.contactRepo.findById(id);

    if (!doc) {
      throw new NotFoundError(
        "contactAdmin:errors.notFound",
        "CONTACT_NOT_FOUND"
      );
    }

    return {
      ...this.mapToContactListItem(doc),
      message: doc.message
    };
  }

  async updateContactStatus(
    id: string,
    status: ContactStatus
  ): Promise<ContactListItem> {
    const updated = await this.contactRepo.updateStatus(id, status);

    if (!updated) {
      throw new NotFoundError(
        "contactAdmin:errors.notFound",
        "CONTACT_NOT_FOUND"
      );
    }

    return this.mapToContactListItem(updated);
  }

  private mapToContactListItem(doc: ContactDocument): ContactListItem {
    return {
      _id: doc._id.toString(),
      email: doc.email ?? null,
      subject: doc.subject,
      priority: doc.priority,
      status: doc.status,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString()
    };
  }
}
