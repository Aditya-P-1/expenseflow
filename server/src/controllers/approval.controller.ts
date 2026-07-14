import { Request, Response } from "express";

import approvalService from "../services/approval.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { MESSAGES } from "../constants/messages";

export const approveClaim = asyncHandler(
  async (req: Request, res: Response) => {
    const claim = await approvalService.approve(
      String(req.params.claimId),
      req.body,
      req.user!
    );

    return res
      .status(200)
      .json(ApiResponse.success(MESSAGES.CLAIM_APPROVED, claim));
  }
);

export const rejectClaim = asyncHandler(
  async (req: Request, res: Response) => {
    const claim = await approvalService.reject(
      String(req.params.claimId),
      req.body,
      req.user!
    );

    return res
      .status(200)
      .json(ApiResponse.success(MESSAGES.CLAIM_REJECTED, claim));
  }
);

export const revertClaim = asyncHandler(
  async (req: Request, res: Response) => {
    const claim = await approvalService.revert(
      String(req.params.claimId),
      req.body,
      req.user!
    );

    return res
      .status(200)
      .json(ApiResponse.success("Claim reverted successfully", claim));
  }
);
