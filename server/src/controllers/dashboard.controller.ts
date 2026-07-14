import { Request, Response } from "express";

import dashboardService from "../services/dashboard.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const employeeDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const dashboard = await dashboardService.employee(req.user!);

    return res
      .status(200)
      .json(ApiResponse.success("Employee dashboard fetched", dashboard));
  }
);

export const managerDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const dashboard = await dashboardService.manager(req.user!);

    return res
      .status(200)
      .json(ApiResponse.success("Manager dashboard fetched", dashboard));
  }
);

export const adminDashboard = asyncHandler(
  async (_req: Request, res: Response) => {
    const dashboard = await dashboardService.admin();

    return res
      .status(200)
      .json(ApiResponse.success("Admin dashboard fetched", dashboard));
  }
);
