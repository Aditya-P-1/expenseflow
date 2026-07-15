import {
  ApprovalAction,
  ClaimStatus,
  Prisma,
  Role,
} from "@prisma/client";

import claimRepository from "../repositories/claim.repository";
import notificationService from "./notification.service";
import userRepository from "../repositories/user.repository";
import {
  ClaimListQuery,
  CreateClaimDto,
  RequestUser,
  UpdateClaimDto,
} from "../types/claim.types";
import { normalizePagination } from "../types/pagination.types";
import AppError from "../utils/AppError";
import { HTTP_STATUS } from "../constants/httpStatus";

const editableStatuses: ClaimStatus[] = [
  ClaimStatus.DRAFT,
  ClaimStatus.REVERTED_TO_EMPLOYEE,
];

class ClaimService {
  private async updateClaimWithActivity(
    claimId: string,
    data: Parameters<typeof claimRepository.updateWithActivity>[1],
    activity: Parameters<typeof claimRepository.updateWithActivity>[2],
    shouldNotifyStatusChange: boolean
  ) {
    const claim = await claimRepository.updateWithActivity(
      claimId,
      data,
      activity
    );

    if (shouldNotifyStatusChange) {
      await notificationService.notifyClaimStatusChanged(
        claim.id,
        activity.actorId
      );
    }

    return claim;
  }

  private async getClaimOrThrow(claimId: string) {
    const claim = await claimRepository.findById(claimId);

    if (!claim) {
      throw new AppError("Claim not found", HTTP_STATUS.NOT_FOUND);
    }

    return claim;
  }

  private async getEmployeeManager(employeeId: string) {
    const employee = await userRepository.findById(employeeId);

    if (!employee?.reportsToId) {
      throw new AppError(
        "Employee is not assigned to a manager",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const manager = await userRepository.findById(employee.reportsToId);

    if (!manager || manager.role !== Role.MANAGER || !manager.isActive) {
      throw new AppError(
        "Assigned manager is not available",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    return manager;
  }

  async create(payload: CreateClaimDto, user: RequestUser) {
    if (user.role !== Role.EMPLOYEE) {
      throw new AppError(
        "Only employees can create claims",
        HTTP_STATUS.FORBIDDEN
      );
    }

    const manager = payload.saveAsDraft
      ? null
      : await this.getEmployeeManager(user.id);

    return claimRepository.create(
      {
        amount: new Prisma.Decimal(payload.amount),
        currency: payload.currency ?? "INR",
        category: payload.category,
        description: payload.description,
        expenseDate: new Date(payload.expenseDate),
        receiptUrl: payload.receiptUrl,
        status: payload.saveAsDraft
          ? ClaimStatus.DRAFT
          : ClaimStatus.PENDING_MANAGER,
        employee: { connect: { id: user.id } },
        pendingWith: manager ? { connect: { id: manager.id } } : undefined,
        submittedAt: payload.saveAsDraft ? undefined : new Date(),
      },
      payload.saveAsDraft
        ? undefined
        : {
            actorId: user.id,
            action: ApprovalAction.SUBMITTED,
            note: "Claim submitted to manager",
          }
    );
  }

  async list(query: ClaimListQuery, user: RequestUser) {
    const pagination = normalizePagination(query);
    const result = await claimRepository.list({
      skip: pagination.skip,
      limit: pagination.limit,
      role: user.role as Role,
      userId: user.id,
      status: query.status,
      category: query.category,
      fromDate: query.fromDate,
      toDate: query.toDate,
    });

    return {
      items: result.items,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit),
      },
    };
  }

  async update(claimId: string, payload: UpdateClaimDto, user: RequestUser) {
    const claim = await this.getClaimOrThrow(claimId);

    if (claim.employeeId !== user.id) {
      throw new AppError(
        "You can update only your own claims",
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (!editableStatuses.includes(claim.status)) {
      throw new AppError(
        "Claim cannot be edited in the current state",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const shouldResubmit = claim.status === ClaimStatus.REVERTED_TO_EMPLOYEE;
    const manager = shouldResubmit
      ? await this.getEmployeeManager(user.id)
      : null;

    return this.updateClaimWithActivity(
      claimId,
      {
        amount:
          payload.amount === undefined
            ? undefined
            : new Prisma.Decimal(payload.amount),
        currency: payload.currency,
        category: payload.category,
        description: payload.description,
        expenseDate: payload.expenseDate
          ? new Date(payload.expenseDate)
            : undefined,
        receiptUrl: payload.receiptUrl,
        status: shouldResubmit ? ClaimStatus.PENDING_MANAGER : undefined,
        pendingWith: manager ? { connect: { id: manager.id } } : undefined,
        submittedAt: shouldResubmit ? new Date() : undefined,
      },
      {
        actorId: user.id,
        action: shouldResubmit ? ApprovalAction.SUBMITTED : ApprovalAction.UPDATED,
        note: shouldResubmit
          ? "Claim updated and submitted to manager"
          : "Claim updated",
      },
      shouldResubmit
    );
  }

  async submit(claimId: string, user: RequestUser) {
    const claim = await this.getClaimOrThrow(claimId);

    if (claim.employeeId !== user.id) {
      throw new AppError(
        "You can submit only your own claims",
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (!editableStatuses.includes(claim.status)) {
      throw new AppError(
        "Claim cannot be submitted in the current state",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const manager = await this.getEmployeeManager(user.id);

    return this.updateClaimWithActivity(
      claimId,
      {
        status: ClaimStatus.PENDING_MANAGER,
        pendingWith: { connect: { id: manager.id } },
        submittedAt: new Date(),
      },
      {
        actorId: user.id,
        action: ApprovalAction.SUBMITTED,
        note: "Claim submitted to manager",
      },
      true
    );
  }

  async remove(claimId: string, user: RequestUser) {
    const claim = await this.getClaimOrThrow(claimId);

    if (claim.employeeId !== user.id && user.role !== Role.ADMIN) {
      throw new AppError(
        "You can delete only your own claims",
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (!editableStatuses.includes(claim.status)) {
      throw new AppError(
        "Claim cannot be deleted in the current state",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    return claimRepository.delete(claimId);
  }

  async uploadReceipt(claimId: string, receiptUrl: string, user: RequestUser) {
    return this.update(claimId, { receiptUrl }, user);
  }

  async timeline(claimId: string, user: RequestUser) {
    const claim = await this.getClaimOrThrow(claimId);

    const canView =
      user.role === Role.ADMIN ||
      claim.employeeId === user.id ||
      claim.pendingWithId === user.id ||
      claim.activities.some((activity) => activity.actorId === user.id);

    if (!canView) {
      throw new AppError(
        "You cannot view this claim timeline",
        HTTP_STATUS.FORBIDDEN
      );
    }

    return claimRepository.timeline(claimId);
  }
}

export default new ClaimService();
