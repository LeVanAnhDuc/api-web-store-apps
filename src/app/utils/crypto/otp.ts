import crypto from "crypto";

const RANDOM_BYTES_SIZE = 4;
const SESSION_ID_BYTES_SIZE = 32;

export const generateOtp = (length: number): string => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  const randomBytes = crypto.randomBytes(RANDOM_BYTES_SIZE);
  const randomNumber = randomBytes.readUInt32BE(0);
  const otp = (randomNumber % (max - min + 1)) + min;

  return otp.toString();
};

export const generateSessionToken = (): string =>
  crypto.randomBytes(SESSION_ID_BYTES_SIZE).toString("hex");

/**
 * Generate cryptographically secure random token
 * Pure function - uses crypto.randomBytes for security
 *
 * @param length - Length of token in characters (not bytes)
 * @returns Hex string token
 *
 * @example
 * generateSecureToken(64) // Returns 64-char hex string
 */
export const generateSecureToken = (length: number): string =>
  crypto.randomBytes(length / 2).toString("hex");
