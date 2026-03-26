import type {
  SubmitContactRequest,
  SubmitContactResponse,
  AdminContactsQuery,
  MyContactsQuery,
  ContactListItem,
  ContactDetailItem as ContactDetailItemType,
  UserContactItem,
  PaginatedResult,
  ContactAttachment,
  ContactAttachmentResponse,
  ContactDocument,
  ContactCategory,
  ContactStatus
} from "@/types/modules/contact-admin";
import type { HandlerResult } from "@/types/http";
import type { ContactRepository } from "@/repositories/contact.repository";
import { CONTACT_STATUSES } from "@/constants/modules/contact-admin";
import { CONTACT_CONFIG, USER_CONFIG } from "@/constants/config";
import { BadRequestError, NotFoundError } from "@/config/responses/error";
import { buildContactFilter } from "./internals/query-builder";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif"
]);

const TICKET_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateRandomSuffix(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += TICKET_CHARS[Math.floor(Math.random() * TICKET_CHARS.length)];
  }
  return result;
}

function generateTicketNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = generateRandomSuffix(CONTACT_CONFIG.TICKET_RANDOM_LENGTH);
  return `TK-${dateStr}-${suffix}`;
}

function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
}

export class ContactAdminService {
  constructor(private readonly contactRepo: ContactRepository) {}

  async submitContact(
    req: SubmitContactRequest
  ): Promise<HandlerResult<SubmitContactResponse>> {
    const { body, user, ip } = req;
    const files = (req.files as Express.Multer.File[]) ?? [];

    let ticketNumber = "";
    let attempts = 0;

    while (attempts < CONTACT_CONFIG.TICKET_MAX_RETRIES) {
      const candidate = generateTicketNumber();
      const exists = await this.contactRepo.ticketExists(candidate);

      if (!exists) {
        ticketNumber = candidate;
        break;
      }

      attempts++;
    }

    if (!ticketNumber) {
      throw new BadRequestError(
        "contactAdmin:errors.ticketGenerationFailed",
        "TICKET_GENERATION_FAILED"
      );
    }

    const email = body.email || (user?.email ?? null);
    const userId = user?.userId ?? null;

    const attachments = files.map((file) => ({
      originalName: file.originalname,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path
    }));

    await this.contactRepo.create({
      ticketNumber,
      userId: userId as never,
      email: email ?? undefined,
      subject: sanitizeText(body.subject),
      message: sanitizeText(body.message),
      attachments,
      status: CONTACT_STATUSES.NEW,
      ipAddress: ip ?? undefined
    });

    return {
      data: { ticketNumber },
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
      message: doc.message,
      ipAddress: doc.ipAddress ?? null,
      attachments: doc.attachments.map((att) => this.mapAttachment(att))
    };
  }

  async updateContactCategory(
    id: string,
    category: ContactCategory
  ): Promise<ContactListItem> {
    const updated = await this.contactRepo.updateCategory(id, category);

    if (!updated) {
      throw new NotFoundError(
        "contactAdmin:errors.notFound",
        "CONTACT_NOT_FOUND"
      );
    }

    return this.mapToContactListItem(updated);
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

  async getMyContacts(
    userId: string,
    query: MyContactsQuery
  ): Promise<PaginatedResult<UserContactItem>> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;

    const { data, total } = await this.contactRepo.findByUser(userId, {
      skip,
      limit,
      sort: { createdAt: sortOrder }
    });

    const items: UserContactItem[] = data.map((doc) => ({
      _id: doc._id.toString(),
      ticketNumber: doc.ticketNumber,
      subject: doc.subject,
      category: doc.category,
      priority: doc.priority,
      status: doc.status,
      attachmentCount: doc.attachments.length,
      createdAt: doc.createdAt.toISOString()
    }));

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  private mapToContactListItem(doc: ContactDocument): ContactListItem {
    return {
      _id: doc._id.toString(),
      ticketNumber: doc.ticketNumber,
      email: doc.email ?? null,
      subject: doc.subject,
      category: doc.category,
      priority: doc.priority,
      status: doc.status,
      userId: doc.userId ? doc.userId.toString() : null,
      attachmentCount: doc.attachments.length,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString()
    };
  }

  private mapAttachment(att: ContactAttachment): ContactAttachmentResponse {
    return {
      originalName: att.originalName,
      fileName: att.fileName,
      mimeType: att.mimeType,
      size: att.size,
      previewUrl: this.buildPreviewUrl(att)
    };
  }

  private buildPreviewUrl(attachment: ContactAttachment): string | null {
    if (!IMAGE_MIME_TYPES.has(attachment.mimeType)) return null;
    const relativePath = attachment.path.replace(/\\/g, "/");
    const normalizedPath = relativePath.includes("uploads/")
      ? relativePath.substring(relativePath.indexOf("uploads/"))
      : relativePath;
    return `${USER_CONFIG.BASE_URL}/${normalizedPath}`;
  }
}
