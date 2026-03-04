import type { Request } from "express";
import type { Document, Types } from "mongoose";
import type {
  CONTACT_CATEGORIES,
  CONTACT_PRIORITIES,
  CONTACT_STATUSES
} from "@/constants/enums";

export type ContactCategory =
  (typeof CONTACT_CATEGORIES)[keyof typeof CONTACT_CATEGORIES];
export type ContactPriority =
  (typeof CONTACT_PRIORITIES)[keyof typeof CONTACT_PRIORITIES];
export type ContactStatus =
  (typeof CONTACT_STATUSES)[keyof typeof CONTACT_STATUSES];

export interface ContactAttachment {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
}

export interface ContactDocument extends Document {
  ticketNumber: string;
  userId?: Types.ObjectId;
  email?: string;
  subject: string;
  category: ContactCategory;
  priority: ContactPriority;
  message: string;
  attachments: ContactAttachment[];
  status: ContactStatus;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitContactBody {
  email?: string;
  subject: string;
  category: ContactCategory;
  priority: ContactPriority;
  message: string;
}

export interface SubmitContactRequest extends Request {
  body: SubmitContactBody;
}

export interface SubmitContactResponse {
  ticketNumber: string;
}
