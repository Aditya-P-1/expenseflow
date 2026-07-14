import { Role } from "@prisma/client";

import dashboardRepository from "../repositories/dashboard.repository";
import { RequestUser } from "../types/claim.types";
import AppError from "../utils/AppError";
import { HTTP_STATUS } from "../constants/httpStatus";

class DashboardService {
  async employee(user: RequestUser) {
    if (user.role !== Role.EMPLOYEE) {
      throw new AppError("Employee access required", HTTP_STATUS.FORBIDDEN);
    }

    return dashboardRepository.employee(user.id);
  }

  async manager(user: RequestUser) {
    if (user.role !== Role.MANAGER && user.role !== Role.SENIOR_MANAGER) {
      throw new AppError("Manager access required", HTTP_STATUS.FORBIDDEN);
    }

    return dashboardRepository.manager(user.id);
  }

  async admin() {
    const [summary, users, claims] = await Promise.all([
      dashboardRepository.adminSummary(),
      dashboardRepository.activeUsersByRole(),
      dashboardRepository.claimsByStatus(),
    ]);

    return { summary, users, claims };
  }
}

export default new DashboardService();
