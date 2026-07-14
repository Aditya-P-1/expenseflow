import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

import AppError from "../utils/AppError";
import { HTTP_STATUS } from "../constants/httpStatus";

export const validate =
  (schema: ZodType) =>
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      req.body = await schema.parseAsync(req.body);

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            error.issues[0].message,
            HTTP_STATUS.BAD_REQUEST
          )
        );
      }

      next(error);
    }
  };