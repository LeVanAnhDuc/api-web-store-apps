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

// ─── v2.0 Query Types ──────────────────────────────────────────────────────

export interface AdminContactsQuery {
  page?: number;
  limit?: number;
  status?: ContactStatus;
  category?: ContactCategory;
  priority?: ContactPriority;
  email?: string;
  ticketNumber?: string;
  userId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: "createdAt" | "priority" | "status" | "category";
  sortOrder?: "asc" | "desc";
}

export interface MyContactsQuery {
  page?: number;
  limit?: number;
  sortBy?: "createdAt";
  sortOrder?: "asc" | "desc";
}

// ─── v2.0 Response Types ───────────────────────────────────────────────────

export interface ContactAttachmentResponse {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  previewUrl: string | null;
}

export interface ContactListItem {
  _id: string;
  ticketNumber: string;
  email: string | null;
  subject: string;
  category: ContactCategory;
  priority: ContactPriority;
  status: ContactStatus;
  userId: string | null;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactDetailItem extends ContactListItem {
  message: string;
  ipAddress: string | null;
  attachments: ContactAttachmentResponse[];
}

export interface UserContactItem {
  _id: string;
  ticketNumber: string;
  subject: string;
  category: ContactCategory;
  priority: ContactPriority;
  status: ContactStatus;
  attachmentCount: number;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
