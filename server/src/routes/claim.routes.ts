import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  claimTimeline,
  createClaim,
  deleteClaim,
  listClaims,
  submitClaim,
  updateClaim,
  uploadReceipt,
} from "../controllers/claim.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createClaimSchema,
  updateClaimSchema,
} from "../validators/claim.validator";

const router = Router();
const receiptDir = path.join(process.cwd(), "uploads", "receipts");

fs.mkdirSync(receiptDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, receiptDir),
    filename: (_req, file, callback) => {
      const uniqueName = `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${path.extname(file.originalname)}`;

      callback(null, uniqueName);
    },
  }),
});

router.use(authenticate);

router.get("/", listClaims);
router.post("/", validate(createClaimSchema), createClaim);
router.patch("/:id", validate(updateClaimSchema), updateClaim);
router.delete("/:id", deleteClaim);
router.post("/:id/submit", submitClaim);
router.post("/:id/receipt", upload.single("receipt"), uploadReceipt);
router.get("/:id/timeline", claimTimeline);

export default router;
