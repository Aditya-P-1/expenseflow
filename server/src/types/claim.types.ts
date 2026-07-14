import { ClaimStatus, ExpenseCategory, Role } from "@prisma/client";

export interface CreateClaimDto {
  amount: number;
  currency?: string;
  category: ExpenseCategory;
  description: string;
  expenseDate: string;
  receiptUrl?: string;
  saveAsDraft?: boolean;
}

export interface UpdateClaimDto {
  amount?: number;
  currency?: string;
  category?: ExpenseCategory;
  description?: string;
  expenseDate?: string;
  receiptUrl?: string | null;
}

export interface ClaimListQuery {
  page?: number;
  limit?: number;
  status?: ClaimStatus;
  category?: ExpenseCategory;
  fromDate?: string;
  toDate?: string;
}

export interface RequestUser {
  id: string;
  email: string;
  role: Role | string;
}
