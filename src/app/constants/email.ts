import path from "path";

export const EMAIL_SERVICE = {
  PROVIDER: "gmail"
} as const;

export const EMAIL_POOL = {
  MAX_CONNECTIONS: 5,
  MAX_MESSAGES_PER_CONNECTION: 100
} as const;

export const EMAIL_RATE_LIMIT = {
  PER_SECOND: 5,
  DELTA_MS: 1000
} as const;

// Using process.cwd() for absolute path from project root
// Avoids relative path errors and works in both dev (src) and prod (dist)
const isCompiledCode = __dirname.includes("dist");
const PROJECT_ROOT = process.cwd();

export const EMAIL_PATHS = {
  TEMPLATES_DIR: path.join(
    PROJECT_ROOT,
    isCompiledCode ? "dist" : "src",
    "app/templates/email"
  )
} as const;
