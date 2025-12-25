import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { User, Prisma } from '@prisma/client';
import { GoogleUser } from '../interfaces/user.interface';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createOrUpdate(googleUser: GoogleUser): Promise<User> {
    const userData: Prisma.UserCreateInput = {
      googleId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name || null,
      picture: googleUser.picture || null,
      lastLoginAt: new Date(),
    };

    return this.prisma.user.upsert({
      where: { googleId: googleUser.id },
      update: {
        email: googleUser.email,
        name: googleUser.name || null,
        picture: googleUser.picture || null,
        lastLoginAt: new Date(),
      },
      create: userData,
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
