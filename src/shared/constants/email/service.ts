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

// Using process.cwd() for absolute path from project root
// Avoids relative path errors and works in both dev (src) and prod (dist)
const isCompiledCode = __dirname.includes("dist");
const PROJECT_ROOT = process.cwd();

export const EMAIL_PATHS = {
  /** Directory containing email HTML templates */
  TEMPLATES_DIR: path.join(
    PROJECT_ROOT,
    isCompiledCode ? "dist" : "src",
    "shared/templates/email"
  )
} as const;
