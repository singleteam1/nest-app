import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/plugins/prisma/prisma.service';
import { NewRefreshToken } from '@/common/interfaces/auth.interface';
import { Role } from '@prisma/generated/enums';

export const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    name?: string;
    role?: Role;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role ?? 'USER',
      },
      select: USER_SELECT,
    });
  }

  async createRefreshToken(data: NewRefreshToken) {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async markRefreshTokenUsed(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeRefreshTokenFamily(familyId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { familyId },
      data: { revokedAt: new Date() },
    });
  }

  async rotateRefreshToken(oldId: string, next: NewRefreshToken) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({ data: next });

      await tx.refreshToken.update({
        where: { id: oldId },
        data: { usedAt: new Date() },
      });

      return created;
    });
  }

  async revokeAllUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
  }
}
