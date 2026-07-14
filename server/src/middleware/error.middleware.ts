import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import AppError from "../utils/AppError";
import logger from "../lib/logger";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please login again.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
}
