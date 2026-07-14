import { Badge } from "@/components/ui/badge";
import { ClaimStatus, Role } from "@/types/domain";

const statusTone: Record<ClaimStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  DRAFT: "default",
  PENDING_MANAGER: "warning",
  PENDING_SENIOR_MANAGER: "info",
  REVERTED_TO_MANAGER: "warning",
  REVERTED_TO_EMPLOYEE: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export function StatusBadge({ status }: { status: ClaimStatus }) {
  return <Badge tone={statusTone[status]}>{status.replaceAll("_", " ")}</Badge>;
}

export function RoleBadge({ role }: { role: Role }) {
  const tone = role === "ADMIN" ? "danger" : role === "EMPLOYEE" ? "default" : "info";

  return <Badge tone={tone}>{role.replaceAll("_", " ")}</Badge>;
}
