// types
import type { AuthTokensResponse } from "@/types/modules/authentication";
// others
import { generateAuthTokens } from "./jwt";
import { TOKEN_EXPIRY } from "@/constants/modules/token";

export interface GenerateAuthTokensInput {
  userId: string;
  authId: string;
  email: string;
  roles: string;
  fullName: string;
  avatar?: string | null;
}

export const generateAuthTokensResponse = (
  input: GenerateAuthTokensInput
): AuthTokensResponse => {
  const { accessToken, refreshToken, idToken } = generateAuthTokens({
    sub: input.userId,
    authId: input.authId,
    email: input.email,
    roles: input.roles,
    name: input.fullName,
    picture: input.avatar ?? null
  });

  return {
    accessToken,
    refreshToken,
    idToken,
    expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
  };
};
