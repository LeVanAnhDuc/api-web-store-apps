export const GENDERS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
  PREFER_NOT_TO_SAY: "prefer_not_to_say"
} as const;

export const FULLNAME_VALIDATION = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 100
} as const;

export const AGE_VALIDATION = {
  MIN_AGE: 13,
  MAX_AGE: 120
} as const;

export const SAFE_FULLNAME_PATTERN = /^[\p{L}\s\-'.]+$/u;

export const SAFE_ADDRESS_PATTERN = /^[\p{L}\p{N}\s,.\-'/#]+$/u;
