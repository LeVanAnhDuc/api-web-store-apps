export const CONTACT_CATEGORIES = {
  ACCOUNT: "account",
  TECHNICAL: "technical",
  FEATURE: "feature",
  BILLING: "billing",
  SECURITY: "security",
  OTHER: "other"
} as const;

export const CONTACT_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
} as const;

export const CONTACT_STATUSES = {
  NEW: "new",
  PROCESSING: "processing",
  RESOLVED: "resolved"
} as const;
