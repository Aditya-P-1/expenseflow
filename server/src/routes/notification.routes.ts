import { Router } from "express";

import {
  listNotifications,
  streamNotifications,
} from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, listNotifications);
router.get("/stream", streamNotifications);

export default router;
