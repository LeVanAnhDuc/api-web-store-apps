// types
import type { AuthTokensResponse } from "@/types/modules/authentication";

export interface UnlockVerifyDto {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

export const toUnlockVerifyDto = (
  data: AuthTokensResponse
): UnlockVerifyDto => ({
  accessToken: data.accessToken,
  refreshToken: data.refreshToken,
  idToken: data.idToken,
  expiresIn: data.expiresIn
});
