import { Request, Response } from "express";

import authRepository from "../repositories/auth.repository";
import notificationService from "../services/notification.service";
import { ApiResponse } from "../utils/ApiResponse";
import AppError from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { HTTP_STATUS } from "../constants/httpStatus";
import { verifyAccessToken } from "../lib/jwt";

export const streamNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const token = String(req.query.token ?? "");

    if (!token) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const payload = verifyAccessToken(token);
    const user = await authRepository.findById(payload.userId);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.UNAUTHORIZED);
    }

    notificationService.connect(user.id, res);
  }
);

export const listNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const notifications =
      await notificationService.listClaimStatusNotifications(req.user!);

    return res
      .status(200)
      .json(ApiResponse.success("Notifications fetched", notifications));
  }
);
