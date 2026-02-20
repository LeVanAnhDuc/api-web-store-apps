import type { AuthTokensResponse } from "@/types/auth";
import { JsonWebTokenService } from "@/services/JsonWebTokenService";
import { TOKEN_EXPIRY } from "@/configurations/jwt";

export const generateAuthTokensResponse = (
  payload: JwtUserPayload
): AuthTokensResponse => {
  const { accessToken, refreshToken, idToken } =
    JsonWebTokenService.generateAuthTokens(payload);

  return {
    accessToken,
    refreshToken,
    idToken,
    expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
  };
};
