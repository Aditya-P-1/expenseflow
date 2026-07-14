import { ClaimStatus, Prisma, Role } from "@prisma/client";

import prisma from "../prisma/prisma";

class DashboardRepository {
  employee(userId: string) {
    return prisma.claim.groupBy({
      by: ["status"],
      where: { employeeId: userId },
      _count: { _all: true },
      _sum: { amount: true },
    });
  }

  manager(userId: string) {
    return prisma.claim.groupBy({
      by: ["status"],
      where: {
        OR: [
          { pendingWithId: userId },
          { activities: { some: { actorId: userId } } },
        ],
      },
      _count: { _all: true },
      _sum: { amount: true },
    });
  }

  async adminSummary() {
    const [totals, monthly] = await prisma.$transaction([
      prisma.claim.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.$queryRaw<
        Array<{
          month: Date;
          total_claimed: Prisma.Decimal | null;
          total_approved: Prisma.Decimal | null;
        }>
      >`
        SELECT
          DATE_TRUNC('month', "createdAt") AS month,
          SUM(amount) AS total_claimed,
          SUM(CASE WHEN status = ${ClaimStatus.APPROVED}::"ClaimStatus" THEN amount ELSE 0 END) AS total_approved
        FROM "Claim"
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `,
    ]);

    return { totals, monthly };
  }

  activeUsersByRole() {
    return prisma.user.groupBy({
      by: ["role"],
      where: { isActive: true, role: { in: Object.values(Role) } },
      _count: { _all: true },
    });
  }

  claimsByStatus() {
    return prisma.claim.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { amount: true },
    });
  }
}

export default new DashboardRepository();
