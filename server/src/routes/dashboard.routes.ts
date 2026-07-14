import { Router } from "express";
import { Role } from "@prisma/client";

import {
  adminDashboard,
  employeeDashboard,
  managerDashboard,
} from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/employee", authorize(Role.EMPLOYEE), employeeDashboard);
router.get(
  "/manager",
  authorize(Role.MANAGER, Role.SENIOR_MANAGER),
  managerDashboard
);
router.get("/admin", authorize(Role.ADMIN), adminDashboard);

export default router;
