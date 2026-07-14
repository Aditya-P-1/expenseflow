import { ApprovalAction, ClaimStatus, Role } from "@prisma/client";

import claimRepository from "../repositories/claim.repository";
import notificationService from "./notification.service";
import userRepository from "../repositories/user.repository";
import { ApprovalActionDto, RejectionDto, RevertDto } from "../types/approval.types";
import { RequestUser } from "../types/claim.types";
import AppError from "../utils/AppError";
import { HTTP_STATUS } from "../constants/httpStatus";

class ApprovalService {
  private async updateClaimStatus(
    claimId: string,
    data: Parameters<typeof claimRepository.updateWithActivity>[1],
    activity: Parameters<typeof claimRepository.updateWithActivity>[2]
  ) {
    const claim = await claimRepository.updateWithActivity(
      claimId,
      data,
      activity
    );

    await notificationService.notifyClaimStatusChanged(claim.id, activity.actorId);

    return claim;
  }

  private async getClaimForReviewer(claimId: string, user: RequestUser) {
    const claim = await claimRepository.findById(claimId);

    if (!claim) {
      throw new AppError("Claim not found", HTTP_STATUS.NOT_FOUND);
    }

    if (claim.pendingWithId !== user.id) {
      throw new AppError(
        "This claim is not pending with you",
        HTTP_STATUS.FORBIDDEN
      );
    }

    return claim;
  }

  private async getManagerSeniorManager(managerId: string) {
    const manager = await userRepository.findById(managerId);

    if (!manager?.reportsToId) {
      throw new AppError(
        "Manager is not assigned to a senior manager",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const seniorManager = await userRepository.findById(manager.reportsToId);

    if (
      !seniorManager ||
      seniorManager.role !== Role.SENIOR_MANAGER ||
      !seniorManager.isActive
    ) {
      throw new AppError(
        "Assigned senior manager is not available",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    return seniorManager;
  }

  async approve(claimId: string, payload: ApprovalActionDto, user: RequestUser) {
    const claim = await this.getClaimForReviewer(claimId, user);

    if (user.role === Role.MANAGER) {
      if (
        claim.status !== ClaimStatus.PENDING_MANAGER &&
        claim.status !== ClaimStatus.REVERTED_TO_MANAGER
      ) {
        throw new AppError(
          "Claim is not awaiting manager approval",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const seniorManager = await this.getManagerSeniorManager(user.id);

      return this.updateClaimStatus(
        claimId,
        {
          status: ClaimStatus.PENDING_SENIOR_MANAGER,
          pendingWith: { connect: { id: seniorManager.id } },
        },
        {
          actorId: user.id,
          action: ApprovalAction.APPROVED,
          note: payload.note,
        }
      );
    }

    if (user.role === Role.SENIOR_MANAGER) {
      if (claim.status !== ClaimStatus.PENDING_SENIOR_MANAGER) {
        throw new AppError(
          "Claim is not awaiting senior manager approval",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      return this.updateClaimStatus(
        claimId,
        {
          status: ClaimStatus.APPROVED,
          pendingWith: { disconnect: true },
          approvedAt: new Date(),
        },
        {
          actorId: user.id,
          action: ApprovalAction.APPROVED,
          note: payload.note,
        }
      );
    }

    throw new AppError(MESSAGES_FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  async reject(claimId: string, payload: RejectionDto, user: RequestUser) {
    const claim = await this.getClaimForReviewer(claimId, user);

    if (user.role !== Role.MANAGER && user.role !== Role.SENIOR_MANAGER) {
      throw new AppError(MESSAGES_FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    if (
      claim.status !== ClaimStatus.PENDING_MANAGER &&
      claim.status !== ClaimStatus.PENDING_SENIOR_MANAGER &&
      claim.status !== ClaimStatus.REVERTED_TO_MANAGER
    ) {
      throw new AppError(
        "Claim cannot be rejected in the current state",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    return this.updateClaimStatus(
      claimId,
      {
        status: ClaimStatus.REJECTED,
        pendingWith: { disconnect: true },
        rejectedAt: new Date(),
      },
      {
        actorId: user.id,
        action: ApprovalAction.REJECTED,
        note: payload.note,
      }
    );
  }

  async revert(claimId: string, payload: RevertDto, user: RequestUser) {
    const claim = await this.getClaimForReviewer(claimId, user);

    if (user.role === Role.SENIOR_MANAGER) {
      if (claim.status !== ClaimStatus.PENDING_SENIOR_MANAGER) {
        throw new AppError(
          "Claim is not awaiting senior manager review",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const managerId = claim.employee.reportsToId;

      if (!managerId) {
        throw new AppError(
          "Claim employee has no manager assigned",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      return this.updateClaimStatus(
        claimId,
        {
          status: ClaimStatus.REVERTED_TO_MANAGER,
          pendingWith: { connect: { id: managerId } },
        },
        {
          actorId: user.id,
          action: ApprovalAction.REVERTED,
          note: payload.note,
        }
      );
    }

    if (user.role === Role.MANAGER) {
      if (
        claim.status !== ClaimStatus.PENDING_MANAGER &&
        claim.status !== ClaimStatus.REVERTED_TO_MANAGER
      ) {
        throw new AppError(
          "Claim is not awaiting manager review",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      return this.updateClaimStatus(
        claimId,
        {
          status: ClaimStatus.REVERTED_TO_EMPLOYEE,
          pendingWith: { connect: { id: claim.employeeId } },
        },
        {
          actorId: user.id,
          action: ApprovalAction.REVERTED,
          note: payload.note,
        }
      );
    }

    throw new AppError(MESSAGES_FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }
}

const MESSAGES_FORBIDDEN = "You are not authorized to perform this action";

export default new ApprovalService();
