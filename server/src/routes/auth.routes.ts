import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  login,
  logout,
  profile,
  reporters,
  refresh,
  signup,
} from "../controllers/auth.controller";

import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";

import { loginSchema, refreshTokenSchema, signupSchema } from "../validators/auth.validator";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/signup",
  authLimiter,
  validate(signupSchema),
  signup
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  login
);

router.get(
  "/reporters",
  reporters
);

router.get(
  "/profile",
  authenticate,
  profile
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  refresh
);

router.post(
  "/logout",
  authenticate,
  logout
);

export default router;
