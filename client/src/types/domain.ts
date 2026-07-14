export type Role = "EMPLOYEE" | "MANAGER" | "SENIOR_MANAGER" | "ADMIN";

export type ClaimStatus =
  | "DRAFT"
  | "PENDING_MANAGER"
  | "PENDING_SENIOR_MANAGER"
  | "REVERTED_TO_MANAGER"
  | "REVERTED_TO_EMPLOYEE"
  | "APPROVED"
  | "REJECTED";

export type ExpenseCategory =
  | "TRAVEL"
  | "FOOD"
  | "ACCOMMODATION"
  | "FUEL"
  | "MEDICAL"
  | "OTHER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  reportsToId?: string | null;
  reportsTo?: Pick<User, "id" | "name" | "email" | "role"> | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Claim {
  id: string;
  claimNumber: string;
  amount: string;
  currency: string;
  category: ExpenseCategory;
  description: string;
  expenseDate: string;
  receiptUrl?: string | null;
  status: ClaimStatus;
  employeeId: string;
  pendingWithId?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Pick<User, "id" | "name" | "email" | "role">;
  pendingWith?: Pick<User, "id" | "name" | "email" | "role"> | null;
  activities?: ClaimActivity[];
}

export interface ClaimActivity {
  id: string;
  claimId: string;
  actorId: string;
  action: "SUBMITTED" | "APPROVED" | "REJECTED" | "REVERTED" | "UPDATED";
  note?: string | null;
  createdAt: string;
  actor: Pick<User, "id" | "name" | "email" | "role">;
}

export interface ClaimStatusNotification {
  id: string;
  type: "CLAIM_STATUS_CHANGED";
  claimId: string;
  claimNumber: string;
  status: ClaimStatus;
  actorId: string;
  employeeId: string;
  employeeName: string;
  message: string;
  createdAt: string;
}

export const roles: Role[] = [
  "EMPLOYEE",
  "MANAGER",
  "SENIOR_MANAGER",
];

export const signupRoles: Exclude<Role, "ADMIN">[] = [
  "EMPLOYEE",
  "MANAGER",
  "SENIOR_MANAGER",
];

export const claimStatuses: ClaimStatus[] = [
  "DRAFT",
  "PENDING_MANAGER",
  "PENDING_SENIOR_MANAGER",
  "REVERTED_TO_MANAGER",
  "REVERTED_TO_EMPLOYEE",
  "APPROVED",
  "REJECTED",
];

export const editableClaimStatuses: ClaimStatus[] = [
  "DRAFT",
  "REVERTED_TO_EMPLOYEE",
];

export const expenseCategories: ExpenseCategory[] = [
  "TRAVEL",
  "FOOD",
  "ACCOMMODATION",
  "FUEL",
  "MEDICAL",
  "OTHER",
];
