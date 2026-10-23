import { Role } from '@/common/interfaces/jwt-payload.interface';

export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string | null;
  role!: Role;
  createdAt!: Date;
}

export class AuthResponseDto {
  accessToken!: string;
  user!: UserResponseDto;
}
