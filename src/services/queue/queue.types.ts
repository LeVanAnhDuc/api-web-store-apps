// types
import type { EmailType } from "@/services/email/email.types";

export interface EmailJobData {
  type: EmailType;
  email: string;
  data: Record<string, unknown>;
  locale?: string;
}
