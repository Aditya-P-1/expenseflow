import { Role } from "@prisma/client";

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: Role;
  reportsToId?: string;
}

export interface UpdateUserDto {
  name?: string;
  role?: Role;
  reportsToId?: string | null;
  isActive?: boolean;
}
