import { PrismaClient, Role, User } from "@prisma/client";
import prisma from "../prisma/prisma";

class AuthRepository {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Store hashed refresh token
   */
  async updateRefreshToken(
    userId: string,
    refreshToken: string | null
  ): Promise<void> {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken,
      },
    });
  }

  async listReporters() {
    return prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: [Role.MANAGER, Role.SENIOR_MANAGER],
        },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  async createUser(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
  reportsToId?: string;
}) {
  return prisma.user.create({
    data,
  });
}
}



export default new AuthRepository();
