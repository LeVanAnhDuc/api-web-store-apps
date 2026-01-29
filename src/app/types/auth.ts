export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}
