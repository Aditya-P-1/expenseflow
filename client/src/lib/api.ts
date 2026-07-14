"use client";

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { AuthResponse, ApiResponse } from "@/types/domain";
import { clearStoredAuth, persistAuth, readStoredAuth } from "./auth-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const api = axios.create({
  baseURL: API_URL,
});

const AUTH_REFRESHED_EVENT = "expenseflow.auth.refreshed";
const AUTH_EXPIRED_EVENT = "expenseflow.auth.expired";

export function notifyAuthExpired() {
  clearStoredAuth();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

export async function refreshSession(refreshToken: string) {
  const response = await axios.post<ApiResponse<AuthResponse>>(
    `${API_URL}/api/auth/refresh`,
    { refreshToken }
  );

  persistAuth(response.data.data);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<AuthResponse>(AUTH_REFRESHED_EVENT, {
        detail: response.data.data,
      })
    );
  }

  return response.data.data;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const auth = readStoredAuth();

  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const auth = readStoredAuth();

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      auth?.refreshToken
    ) {
      originalRequest._retry = true;

      try {
        const refreshedAuth = await refreshSession(auth.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${refreshedAuth.accessToken}`;

        return api(originalRequest);
      } catch {
        notifyAuthExpired();
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

export { API_URL };
export { AUTH_EXPIRED_EVENT, AUTH_REFRESHED_EVENT };
