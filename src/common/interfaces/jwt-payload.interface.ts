export type Role = 'USER' | 'ADMIN';

export interface AccessTokenPayload {
  [claim: string]: unknown;
  sub: string;
  email: string;
  role: Role;
  type?: 'access';
}
