import { Role } from "@prisma/client";

import userRepository from "../repositories/user.repository";
import { CreateUserDto, UpdateUserDto } from "../types/user.types";
import { normalizePagination } from "../types/pagination.types";
import { hashValue } from "../lib/bcrypt";
import AppError from "../utils/AppError";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";

class UserService {
  private async assertReporter(role: Role, reportsToId?: string | null) {
    if (!reportsToId) {
      if (role === Role.EMPLOYEE || role === Role.MANAGER) {
        throw new AppError(
          "Reporting manager is required for this role",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      return;
    }

    const reporter = await userRepository.findById(reportsToId);

    if (!reporter || !reporter.isActive) {
      throw new AppError("Reporter not found", HTTP_STATUS.BAD_REQUEST);
    }

    if (role === Role.EMPLOYEE && reporter.role !== Role.MANAGER) {
      throw new AppError(
        "Employees must report to a manager",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (role === Role.MANAGER && reporter.role !== Role.SENIOR_MANAGER) {
      throw new AppError(
        "Managers must report to a senior manager",
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  async create(payload: CreateUserDto) {
    const existingUser = await userRepository.findByEmail(payload.email);

    if (existingUser) {
      throw new AppError(
        MESSAGES.USER_ALREADY_EXISTS,
        HTTP_STATUS.CONFLICT
      );
    }

    await this.assertReporter(payload.role, payload.reportsToId);

    const password = await hashValue(payload.password);

    const user = await userRepository.create({
      name: payload.name,
      email: payload.email,
      password,
      role: payload.role,
      reportsTo: payload.reportsToId
        ? { connect: { id: payload.reportsToId } }
        : undefined,
    });

    const { password: _password, refreshToken: _refreshToken, ...safeUser } =
      user;

    return safeUser;
  }

  async update(userId: string, payload: UpdateUserDto) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const nextRole = payload.role ?? user.role;
    const nextReportsToId =
      payload.reportsToId === undefined
        ? user.reportsToId
        : payload.reportsToId;

    await this.assertReporter(nextRole, nextReportsToId);

    const updatedUser = await userRepository.update(userId, {
      name: payload.name,
      role: payload.role,
      isActive: payload.isActive,
      reportsTo:
        payload.reportsToId === undefined
          ? undefined
          : payload.reportsToId
          ? { connect: { id: payload.reportsToId } }
          : { disconnect: true },
    });

    const { password: _password, refreshToken: _refreshToken, ...safeUser } =
      updatedUser;

    return safeUser;
  }

  async list(query: {
    page?: number;
    limit?: number;
    role?: Role;
    search?: string;
  }) {
    const pagination = normalizePagination(query);
    const result = await userRepository.list({
      skip: pagination.skip,
      limit: pagination.limit,
      role: query.role,
      search: query.search,
    });

    return {
      items: result.items,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit),
      },
    };
  }

  hierarchy() {
    return userRepository.hierarchy();
  }
}

export default new UserService();
