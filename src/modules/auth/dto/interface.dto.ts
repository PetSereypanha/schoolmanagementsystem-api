export interface TokenPayload {
  id: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}