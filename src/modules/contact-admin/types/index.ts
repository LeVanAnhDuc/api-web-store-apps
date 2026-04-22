// types
import type { Request } from "express";
import type { Document } from "mongoose";
import type { CONTACT_PRIORITIES, CONTACT_STATUSES } from "../constants";

export type ContactPriority =
  (typeof CONTACT_PRIORITIES)[keyof typeof CONTACT_PRIORITIES];
export type ContactStatus =
  (typeof CONTACT_STATUSES)[keyof typeof CONTACT_STATUSES];

export interface ContactDocument extends Document {
  email?: string;
  subject: string;
  priority: ContactPriority;
  message: string;
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitContactBody {
  email?: string;
  subject: string;
  message: string;
}

export interface SubmitContactRequest extends Omit<Request, "user"> {
  body: SubmitContactBody;
}

// ─── v2.0 Query Types ──────────────────────────────────────────────────────

export interface AdminContactsQuery {
  page?: number;
  limit?: number;
  status?: ContactStatus;
  priority?: ContactPriority;
  email?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: "createdAt" | "priority" | "status";
  sortOrder?: "asc" | "desc";
}

export interface AdminContactsQueryRequest extends Omit<Request, "query"> {
  query: AdminContactsQuery;
}

export interface ContactIdParamRequest extends Omit<Request, "params"> {
  params: { id: string };
}

export interface UpdateContactStatusRequest
  extends Omit<Request, "params" | "body"> {
  params: { id: string };
  body: { status: ContactStatus };
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
