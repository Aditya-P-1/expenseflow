import { Role } from "@prisma/client";

export interface SignupDto {
  name: string;
  email: string;
  password: string;

  role?: Role;

  reportsToId?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}