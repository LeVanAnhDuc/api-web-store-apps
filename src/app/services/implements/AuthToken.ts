import type { AuthTokensResponse, TokenPayload } from "@/app/types/auth";
import { JsonWebTokenService } from "@/app/services/JsonWebTokenService";
import { TOKEN_EXPIRY } from "@/infra/configs/jwt";

export const generateAuthTokensResponse = (
  payload: TokenPayload
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
