import authRepository from "../repositories/auth.repository";
import AppError from "../utils/AppError";

import { compareHash, hashValue } from "../lib/bcrypt";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";

import {
  LoginDto,
  LoginResponseDto,
  SignupDto,
} from "../types/auth.types";

import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import { Role } from "@prisma/client";

class AuthService {
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

    const reporter = await authRepository.findById(reportsToId);

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

  reporters() {
    return authRepository.listReporters();
  }

  /**
   * Validate user credentials
   */
  private async validateUser(email: string, password: string) {
    const user = await authRepository.findByEmail(email);

    if (!user) {
      throw new AppError(
        MESSAGES.INVALID_CREDENTIALS,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (!user.isActive) {
      throw new AppError(
        "User account is inactive",
        HTTP_STATUS.FORBIDDEN
      );
    }

    const isPasswordValid = await compareHash(
      password,
      user.password
    );

    if (!isPasswordValid) {
      throw new AppError(
        MESSAGES.INVALID_CREDENTIALS,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    return user;
  }

  /**
   * Login User
   */
  async login(payload: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(
      payload.email,
      payload.password
    );

    const jwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(jwtPayload);

    const refreshToken = generateRefreshToken(jwtPayload);

    const hashedRefreshToken = await hashValue(refreshToken);

    await authRepository.updateRefreshToken(
      user.id,
      hashedRefreshToken
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async profile(userId: string) {
  const user = await authRepository.findById(userId);

  if (!user) {
    throw new AppError(
      MESSAGES.USER_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async refreshToken(
  refreshToken: string
): Promise<LoginResponseDto> {

  const payload = verifyRefreshToken(refreshToken);

  const user = await authRepository.findById(payload.userId);

  if (!user || !user.refreshToken) {
    throw new AppError(
      MESSAGES.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const isValid = await compareHash(
    refreshToken,
    user.refreshToken
  );

  if (!isValid) {
    throw new AppError(
      MESSAGES.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const newAccessToken =
    generateAccessToken(jwtPayload);

  const newRefreshToken =
    generateRefreshToken(jwtPayload);

  const hashedRefreshToken =
    await hashValue(newRefreshToken);

  await authRepository.updateRefreshToken(
    user.id,
    hashedRefreshToken
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

async signup(
  payload: SignupDto
): Promise<LoginResponseDto> {

  const existingUser =
    await authRepository.findByEmail(payload.email);

  if (existingUser) {
    throw new AppError(
      MESSAGES.USER_ALREADY_EXISTS,
      HTTP_STATUS.CONFLICT
    );
  }

  const role = payload.role ?? Role.EMPLOYEE;

  if (role === Role.ADMIN) {
    throw new AppError(
      "Admin accounts cannot be created from signup",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  await this.assertReporter(role, payload.reportsToId);

  const hashedPassword =
    await hashValue(payload.password);

  const user =
    await authRepository.createUser({
      ...payload,
      password: hashedPassword,
      role,
    });

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken =
    generateAccessToken(jwtPayload);

  const refreshToken =
    generateRefreshToken(jwtPayload);

  const hashedRefreshToken =
    await hashValue(refreshToken);

  await authRepository.updateRefreshToken(
    user.id,
    hashedRefreshToken
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

async logout(userId: string): Promise<void> {
  const user = await authRepository.findById(userId);

  if (!user) {
    throw new AppError(
      MESSAGES.USER_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  await authRepository.updateRefreshToken(
    userId,
    null
  );
}
}

export default new AuthService();
