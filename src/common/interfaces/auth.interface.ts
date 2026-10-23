import { Role } from './jwt-payload.interface';

export interface GeneratedRefreshToken {
  token: string;
  hash: string;
}

export interface NewRefreshToken {
  familyId: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}
