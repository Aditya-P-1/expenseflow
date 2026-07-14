import { Request, Response, NextFunction } from "express";

import AppError from "../utils/AppError";

import { verifyAccessToken } from "../lib/jwt";

import authRepository from "../repositories/auth.repository";

import { HTTP_STATUS } from "../constants/httpStatus";
import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError(
        "Unauthorized",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const token = authorization.split(" ")[1];

    const payload = verifyAccessToken(token);

    const user = await authRepository.findById(payload.userId);

    if (!user) {
      throw new AppError(
        "User not found",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
