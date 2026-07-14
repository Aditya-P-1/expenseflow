import { Request, Response } from "express";

import authService from "../services/auth.service";

import { asyncHandler } from "../utils/asyncHandler";

import { ApiResponse } from "../utils/ApiResponse";

import { MESSAGES } from "../constants/messages";

export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    return res.status(200).json(
      ApiResponse.success(
        MESSAGES.LOGIN_SUCCESS,
        result
      )
    );
  }
);

export const profile = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await authService.profile(req.user!.id);

    return res.status(200).json(
      ApiResponse.success(
        MESSAGES.PROFILE_FETCHED,
        user
      )
    );
  }
);

export const refresh = asyncHandler(
  async (req: Request, res: Response) => {

    const result =
      await authService.refreshToken(
        req.body.refreshToken
      );

    return res.status(200).json(
      ApiResponse.success(
        MESSAGES.TOKEN_REFRESHED,
        result
      )
    );
  }
);

export const signup = asyncHandler(
  async (req: Request, res: Response) => {

    const result =
      await authService.signup(req.body);

    return res.status(201).json(
      ApiResponse.success(
        MESSAGES.SIGNUP_SUCCESS,
        result
      )
    );
  }
);

export const reporters = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await authService.reporters();

    return res.status(200).json(
      ApiResponse.success(
        "Reporting options fetched",
        result
      )
    );
  }
);

export const logout = asyncHandler(
  async (req: Request, res: Response) => {
    await authService.logout(req.user!.id);

    return res.status(200).json(
      ApiResponse.success(
        MESSAGES.LOGOUT_SUCCESS
      )
    );
  }
);
