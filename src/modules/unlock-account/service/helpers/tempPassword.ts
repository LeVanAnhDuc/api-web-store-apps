import crypto from "crypto";

const TEMP_PASSWORD_LENGTH = 16;
const MIN_PASSWORD_LENGTH = 12;

const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const NUMBER_CHARS = "0123456789";
const SPECIAL_CHARS = "!@#$%^&*";
const ALL_CHARS =
  UPPERCASE_CHARS + LOWERCASE_CHARS + NUMBER_CHARS + SPECIAL_CHARS;

const getRandomChar = (chars: string): string => {
  const randomIndex = crypto.randomBytes(1).readUInt8(0) % chars.length;
  return chars[randomIndex];
};

const shuffleString = (str: string): string => {
  const chars = str.split("");

  for (let i = chars.length - 1; i > 0; i--) {
    const randomIndex = crypto.randomBytes(1).readUInt8(0) % (i + 1);
    [chars[i], chars[randomIndex]] = [chars[randomIndex], chars[i]];
  }

  return chars.join("");
};

export const generateTempPassword = (
  length: number = TEMP_PASSWORD_LENGTH
): string => {
  if (length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Temporary password length must be at least ${MIN_PASSWORD_LENGTH} characters`
    );
  }

  const passwordChars: string[] = [];

  passwordChars.push(getRandomChar(UPPERCASE_CHARS));
  passwordChars.push(getRandomChar(LOWERCASE_CHARS));
  passwordChars.push(getRandomChar(NUMBER_CHARS));
  passwordChars.push(getRandomChar(SPECIAL_CHARS));

  const remainingLength = length - 4;
  for (let i = 0; i < remainingLength; i++) {
    passwordChars.push(getRandomChar(ALL_CHARS));
  }

  return shuffleString(passwordChars.join(""));
};
