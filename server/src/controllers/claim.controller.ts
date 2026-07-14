import { Request, Response } from "express";
import { ClaimStatus, ExpenseCategory } from "@prisma/client";

import claimService from "../services/claim.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { MESSAGES } from "../constants/messages";

export const createClaim = asyncHandler(async (req: Request, res: Response) => {
  const claim = await claimService.create(req.body, req.user!);

  return res
    .status(201)
    .json(ApiResponse.success(MESSAGES.CLAIM_CREATED, claim));
});

export const listClaims = asyncHandler(async (req: Request, res: Response) => {
  const claims = await claimService.list(
    {
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      status: req.query.status as ClaimStatus | undefined,
      category: req.query.category as ExpenseCategory | undefined,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
    },
    req.user!
  );

  return res
    .status(200)
    .json(ApiResponse.success("Claims fetched successfully", claims));
});

export const updateClaim = asyncHandler(async (req: Request, res: Response) => {
  const claim = await claimService.update(
    String(req.params.id),
    req.body,
    req.user!
  );

  return res
    .status(200)
    .json(ApiResponse.success(MESSAGES.CLAIM_UPDATED, claim));
});

export const submitClaim = asyncHandler(async (req: Request, res: Response) => {
  const claim = await claimService.submit(String(req.params.id), req.user!);

  return res
    .status(200)
    .json(ApiResponse.success("Claim submitted successfully", claim));
});

export const deleteClaim = asyncHandler(async (req: Request, res: Response) => {
  await claimService.remove(String(req.params.id), req.user!);

  return res
    .status(200)
    .json(ApiResponse.success(MESSAGES.CLAIM_DELETED));
});

export const uploadReceipt = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res
        .status(400)
        .json(ApiResponse.error("Receipt file is required"));
    }

    const receiptUrl = `/uploads/receipts/${req.file.filename}`;
    const claim = await claimService.uploadReceipt(
      String(req.params.id),
      receiptUrl,
      req.user!
    );

    return res
      .status(200)
      .json(ApiResponse.success("Receipt uploaded successfully", claim));
  }
);

export const claimTimeline = asyncHandler(
  async (req: Request, res: Response) => {
    const timeline = await claimService.timeline(
      String(req.params.id),
      req.user!
    );

    return res
      .status(200)
      .json(ApiResponse.success("Activity timeline fetched", timeline));
  }
);
