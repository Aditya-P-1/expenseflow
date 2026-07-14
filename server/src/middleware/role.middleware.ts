import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";

import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import AppError from "../utils/AppError";

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
      );
    }

    if (!roles.includes(req.user.role as Role)) {
      return next(new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN));
    }

    next();
  };
