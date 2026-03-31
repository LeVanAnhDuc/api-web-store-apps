// types
import type { AuthTokensResponse } from "@/types/modules/authentication";
// others
import { generateAuthTokens } from "./jwt";
import { TOKEN_EXPIRY } from "@/constants/modules/token";

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
