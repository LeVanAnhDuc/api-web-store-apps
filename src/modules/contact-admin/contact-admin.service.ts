// types
import type {
  SubmitContactBody,
  AdminContactsQuery,
  PaginatedResult,
  ContactStatus
} from "./types";
import type { ContactRepository } from "./contact-admin.repository";
import type {
  SubmitContactResponseDto,
  ContactListItemDto,
  ContactDetailItemDto,
  UpdateContactStatusDto
} from "./dtos";
// common
import { NotFoundError } from "@/common/exceptions";
// validators
import { sanitizeText, validateStringLength } from "@/validators/utils";
import { CONTACT_CONFIG } from "@/validators/constants";
// dtos
import {
  toSubmitContactResponseDto,
  toContactListItemDto,
  toContactDetailItemDto,
  toUpdateContactStatusDto
} from "./dtos";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { CONTACT_STATUSES } from "./constants";
import { buildContactFilter } from "./helpers";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class ContactAdminService {
  constructor(private readonly contactRepo: ContactRepository) {}

  async submitContact(
    body: SubmitContactBody
  ): Promise<SubmitContactResponseDto> {
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

    return toSubmitContactResponseDto(contact);
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

  async getContactDetail(id: string): Promise<ContactDetailItemDto> {
    const doc = await this.contactRepo.findById(id);

    if (!doc) {
      throw new NotFoundError({
        i18nMessage: (t) => t("contactAdmin:errors.notFound"),
        code: ERROR_CODES.CONTACT_NOT_FOUND
      });
    }

    return toContactDetailItemDto(doc);
  }

  async updateContactStatus(
    id: string,
    status: ContactStatus
  ): Promise<UpdateContactStatusDto> {
    const updated = await this.contactRepo.updateStatus(id, status);

    if (!updated) {
      throw new NotFoundError({
        i18nMessage: (t) => t("contactAdmin:errors.notFound"),
        code: ERROR_CODES.CONTACT_NOT_FOUND
      });
    }

    return toUpdateContactStatusDto(updated);
  }
}
