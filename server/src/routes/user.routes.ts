import { Router } from "express";
import { Role } from "@prisma/client";

import {
  createUser,
  listUsers,
  reportingHierarchy,
  updateUser,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createUserSchema,
  updateUserSchema,
} from "../validators/user.validator";

const router = Router();

router.use(authenticate);

router.get("/", authorize(Role.ADMIN), listUsers);
router.get("/hierarchy", authorize(Role.ADMIN), reportingHierarchy);

router.post("/", authorize(Role.ADMIN), validate(createUserSchema), createUser);
router.patch(
  "/:id",
  authorize(Role.ADMIN),
  validate(updateUserSchema),
  updateUser
);

export default router;
