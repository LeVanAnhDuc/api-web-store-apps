import type { AuthTokensResponse } from "@/types/auth";
import { generateAuthTokens } from "./jwt";
import { TOKEN_EXPIRY } from "@/constants/infrastructure";

export const generateAuthTokensResponse = (
  payload: JwtUserPayload
): AuthTokensResponse => {
  const { accessToken, refreshToken, idToken } = generateAuthTokens(payload);

  return {
    accessToken,
    refreshToken,
    idToken,
    expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
  };
};
