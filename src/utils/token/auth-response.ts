// types
import type { AuthTokensResponse } from "@/modules/authentication/types";
// others
import {
  generateAccessToken,
  generateIdToken,
  generateRefreshToken
} from "./jwt";
import { TOKEN_EXPIRY } from "@/constants/modules/token";

export const generateAuthTokensResponse = ({
  userId,
  authId,
  email,
  roles,
  fullName,
  avatar
}: {
  userId: string;
  authId: string;
  email: string;
  roles: string;
  fullName: string;
  avatar?: string | null;
}): AuthTokensResponse => {
  const { accessToken, refreshToken, idToken } = {
    accessToken: generateAccessToken({
      sub: userId,
      authId: authId,
      roles: roles
    }),
    refreshToken: generateRefreshToken({
      sub: userId,
      authId: authId
    }),
    idToken: generateIdToken({
      sub: userId,
      name: fullName,
      email: email,
      picture: avatar ?? null
    })
  };

  return {
    accessToken,
    refreshToken,
    idToken,
    expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
  };
};
