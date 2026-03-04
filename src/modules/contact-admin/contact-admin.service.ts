import type {
  SubmitContactRequest,
  SubmitContactResponse
} from "@/types/modules/contact-admin";
import type { HandlerResult } from "@/types/http";
import type { ContactRepository } from "./repositories/contact.repository";
import { CONTACT_PRIORITIES, CONTACT_STATUSES } from "@/constants/enums";
import { CONTACT_CONFIG } from "@/constants/config";
import { BadRequestError } from "@/config/responses/error";

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
      category: body.category,
      priority: body.priority ?? CONTACT_PRIORITIES.MEDIUM,
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
}
