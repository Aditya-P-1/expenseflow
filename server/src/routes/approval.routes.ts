import { Router } from "express";
import { Role } from "@prisma/client";

import {
  approveClaim,
  rejectClaim,
  revertClaim,
} from "../controllers/approval.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  approvalSchema,
  rejectionSchema,
  revertSchema,
} from "../validators/approval.validator";

const router = Router();

router.use(authenticate);
router.use(authorize(Role.MANAGER, Role.SENIOR_MANAGER));

router.post("/:claimId/approve", validate(approvalSchema), approveClaim);
router.post("/:claimId/reject", validate(rejectionSchema), rejectClaim);
router.post("/:claimId/revert", validate(revertSchema), revertClaim);

export default router;
