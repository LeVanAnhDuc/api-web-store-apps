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
