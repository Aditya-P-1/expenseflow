import {
  ApprovalAction,
  Claim,
  ClaimStatus,
  ExpenseCategory,
  Prisma,
  Role,
} from "@prisma/client";

import prisma from "../prisma/prisma";

class ClaimRepository {
  findById(id: string) {
    return prisma.claim.findUnique({
      where: { id },
      include: {
        employee: true,
        pendingWith: true,
        activities: {
          orderBy: { createdAt: "asc" },
          include: {
            actor: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });
  }

  async create(data: Prisma.ClaimCreateInput, activity?: {
    actorId: string;
    action: ApprovalAction;
    note?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const claim = await tx.claim.create({ data });

      if (activity) {
        await tx.claimActivity.create({
          data: {
            claimId: claim.id,
            actorId: activity.actorId,
            action: activity.action,
            note: activity.note,
          },
        });
      }

      return claim;
    });
  }

  async updateWithActivity(
    claimId: string,
    data: Prisma.ClaimUpdateInput,
    activity: {
      actorId: string;
      action: ApprovalAction;
      note?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const claim = await tx.claim.update({
        where: { id: claimId },
        data,
      });

      await tx.claimActivity.create({
        data: {
          claimId,
          actorId: activity.actorId,
          action: activity.action,
          note: activity.note,
        },
      });

      return claim;
    });
  }

  update(claimId: string, data: Prisma.ClaimUpdateInput): Promise<Claim> {
    return prisma.claim.update({
      where: { id: claimId },
      data,
    });
  }

  delete(claimId: string): Promise<Claim> {
    return prisma.claim.delete({ where: { id: claimId } });
  }

  async list(params: {
    skip: number;
    limit: number;
    role: Role;
    userId: string;
    status?: ClaimStatus;
    category?: ExpenseCategory;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: Prisma.ClaimWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.fromDate || params.toDate
        ? {
            expenseDate: {
              ...(params.fromDate ? { gte: new Date(params.fromDate) } : {}),
              ...(params.toDate ? { lte: new Date(params.toDate) } : {}),
            },
          }
        : {}),
    };

    if (params.role === Role.EMPLOYEE) {
      where.employeeId = params.userId;
    }

    if (params.role === Role.MANAGER || params.role === Role.SENIOR_MANAGER) {
      where.OR = [
        { pendingWithId: params.userId },
        { activities: { some: { actorId: params.userId } } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.claim.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: {
          employee: {
            select: { id: true, name: true, email: true, role: true },
          },
          pendingWith: {
            select: { id: true, name: true, email: true, role: true },
          },
          activities: {
            where: { action: ApprovalAction.REVERTED },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              actor: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
        },
      }),
      prisma.claim.count({ where }),
    ]);

    return { items, total };
  }

  timeline(claimId: string) {
    return prisma.claimActivity.findMany({
      where: { claimId },
      orderBy: { createdAt: "asc" },
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async nextClaimNumber() {
    const count = await prisma.claim.count();
    return `CLM-${new Date().getFullYear()}-${String(count + 1).padStart(
      5,
      "0"
    )}`;
  }
}

export default new ClaimRepository();
