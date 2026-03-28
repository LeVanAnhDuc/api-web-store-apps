import type {
  SubmitContactBody,
  AdminContactsQuery,
  ContactDetailItem as ContactDetailItemType,
  PaginatedResult,
  ContactStatus
} from "@/types/modules/contact-admin";
import type { HandlerResult } from "@/types/http";
import type { ContactRepository } from "./repositories/contact.repository";
import type { SubmitContactResponseDto } from "./dto/submit-contact.dto";
import { toSubmitContactResponseDto } from "./dto/submit-contact.dto";
import type { ContactListItemDto } from "./dto/contact-list-item.dto";
import { toContactListItemDto } from "./dto/contact-list-item.dto";
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
      data: toSubmitContactResponseDto(contact)
    };
  }

  async getContactList(
    query: AdminContactsQuery
  ): Promise<PaginatedResult<ContactListItemDto>> {
    const {
      page = DEFAULT_PAGE,
      limit: rawLimit = DEFAULT_LIMIT,
      sortBy = "createdAt",
      sortOrder: rawSortOrder = "desc"
    } = query;

    const limit = Math.min(rawLimit, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const sortOrder = rawSortOrder === "asc" ? 1 : -1;

    const filter = buildContactFilter(query);
    const { data, total } = await this.contactRepo.findAll(filter, {
      skip,
      limit,
      sort: { [sortBy]: sortOrder }
    });

    return {
      items: data.map(toContactListItemDto),
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
      ...toContactListItemDto(doc),
      message: doc.message
    };
  }

  async updateContactStatus(
    id: string,
    status: ContactStatus
  ): Promise<ContactListItemDto> {
    const updated = await this.contactRepo.updateStatus(id, status);

    if (!updated) {
      throw new NotFoundError(
        "contactAdmin:errors.notFound",
        "CONTACT_NOT_FOUND"
      );
    }

    return toContactListItemDto(updated);
  }
}
