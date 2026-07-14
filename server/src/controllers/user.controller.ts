import { Request, Response } from "express";
import { Role } from "@prisma/client";

import userService from "../services/user.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { MESSAGES } from "../constants/messages";

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.create(req.body);

  return res
    .status(201)
    .json(ApiResponse.success(MESSAGES.USER_CREATED, user));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.update(String(req.params.id), req.body);

  return res
    .status(200)
    .json(ApiResponse.success(MESSAGES.USER_UPDATED, user));
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.list({
    page: Number(req.query.page),
    limit: Number(req.query.limit),
    role: req.query.role as Role | undefined,
    search: req.query.search as string | undefined,
  });

  return res
    .status(200)
    .json(ApiResponse.success("Users fetched successfully", result));
});

export const reportingHierarchy = asyncHandler(
  async (_req: Request, res: Response) => {
    const hierarchy = await userService.hierarchy();

    return res
      .status(200)
      .json(ApiResponse.success("Reporting hierarchy fetched", hierarchy));
  }
);
