import { Response } from "express";
import { ApprovalAction, ClaimStatus, Role } from "@prisma/client";

import claimRepository from "../repositories/claim.repository";
import prisma from "../prisma/prisma";
import userRepository from "../repositories/user.repository";
import { RequestUser } from "../types/claim.types";

type NotificationClient = {
  response: Response;
  heartbeat: NodeJS.Timeout;
};

type ClaimStatusNotification = {
  id: string;
  type: "CLAIM_STATUS_CHANGED";
  claimId: string;
  claimNumber: string;
  status: ClaimStatus;
  actorId: string;
  employeeId: string;
  employeeName: string;
  message: string;
  createdAt: string;
};

class NotificationService {
  private clients = new Map<string, Set<NotificationClient>>();

  connect(userId: string, response: Response) {
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Accel-Buffering", "no");
    response.flushHeaders?.();

    const client: NotificationClient = {
      response,
      heartbeat: setInterval(() => {
        response.write(": heartbeat\n\n");
      }, 25000),
    };

    const userClients = this.clients.get(userId) ?? new Set<NotificationClient>();
    userClients.add(client);
    this.clients.set(userId, userClients);

    response.write(
      `event: connected\ndata: ${JSON.stringify({ connected: true })}\n\n`
    );

    response.on("close", () => {
      clearInterval(client.heartbeat);
      userClients.delete(client);

      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    });
  }

  async notifyClaimStatusChanged(claimId: string, actorId: string) {
    const claim = await claimRepository.findById(claimId);

    if (!claim) {
      return;
    }

    const recipientIds = new Set<string>([claim.employeeId]);

    if (claim.employee.reportsToId) {
      recipientIds.add(claim.employee.reportsToId);

      const manager = await userRepository.findById(claim.employee.reportsToId);
      if (manager?.reportsToId) {
        recipientIds.add(manager.reportsToId);
      }
    }

    const admins = await userRepository.findActiveAdmins();
    admins.forEach((admin) => recipientIds.add(admin.id));

    const payload: ClaimStatusNotification = {
      id: `${claim.id}:${claim.status}:${Date.now()}`,
      type: "CLAIM_STATUS_CHANGED",
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      status: claim.status,
      actorId,
      employeeId: claim.employeeId,
      employeeName: claim.employee.name,
      message: `Claim ${claim.claimNumber} for ${claim.employee.name} is now ${this.formatStatus(
        claim.status
      )}.`,
      createdAt: new Date().toISOString(),
    };

    recipientIds.forEach((recipientId) => {
      this.send(recipientId, "claim-status", payload);
    });
  }

  async listClaimStatusNotifications(user: RequestUser) {
    const where = {
      action: {
        in: [
          ApprovalAction.SUBMITTED,
          ApprovalAction.APPROVED,
          ApprovalAction.REJECTED,
          ApprovalAction.REVERTED,
        ],
      },
      claim: {
        ...(user.role === Role.EMPLOYEE ? { employeeId: user.id } : {}),
        ...(user.role === Role.MANAGER
          ? { employee: { reportsToId: user.id } }
          : {}),
        ...(user.role === Role.SENIOR_MANAGER
          ? { employee: { reportsTo: { reportsToId: user.id } } }
          : {}),
      },
    };

    const activities = await prisma.claimActivity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        claim: {
          include: {
            employee: true,
          },
        },
      },
    });

    return activities.map((activity) => ({
      id: activity.id,
      type: "CLAIM_STATUS_CHANGED" as const,
      claimId: activity.claim.id,
      claimNumber: activity.claim.claimNumber,
      status: activity.claim.status,
      actorId: activity.actorId,
      employeeId: activity.claim.employeeId,
      employeeName: activity.claim.employee.name,
      message: `Claim ${activity.claim.claimNumber} for ${
        activity.claim.employee.name
      } is now ${this.formatStatus(activity.claim.status)}.`,
      createdAt: activity.createdAt.toISOString(),
    }));
  }

  private send(userId: string, event: string, payload: ClaimStatusNotification) {
    const userClients = this.clients.get(userId);

    if (!userClients) {
      return;
    }

    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    userClients.forEach((client) => client.response.write(message));
  }

  private formatStatus(status: ClaimStatus) {
    return status.replaceAll("_", " ").toLowerCase();
  }
}

export type { ClaimStatusNotification };
export default new NotificationService();
