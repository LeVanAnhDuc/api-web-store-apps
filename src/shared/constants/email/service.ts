import path from "path";

export const EMAIL_SERVICE = {
  /** Email service provider (e.g., 'gmail', 'outlook') */
  PROVIDER: "gmail"
} as const;

export const EMAIL_POOL = {
  /** Maximum number of concurrent connections */
  MAX_CONNECTIONS: 5,
  /** Maximum messages per connection before reconnecting */
  MAX_MESSAGES_PER_CONNECTION: 100
} as const;

export const EMAIL_RATE_LIMIT = {
  /** Maximum emails per rate delta period */
  PER_SECOND: 5,
  /** Rate limit time window in milliseconds */
  DELTA_MS: 1000
} as const;

export const EMAIL_PATHS = {
  /** Directory containing email HTML templates */
  TEMPLATES_DIR: path.join(__dirname, "../../../templates/email")
} as const;
