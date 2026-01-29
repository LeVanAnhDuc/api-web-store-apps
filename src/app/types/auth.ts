export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  userId: string;
  authId: string;
  email: string;
  roles: string;
}
