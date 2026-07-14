"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AuthResponse, User } from "@/types/domain";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthResponse>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.hydrated = true;
    },
    setHydrated(state) {
      state.hydrated = true;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.hydrated = true;
    },
  },
});

export const { logout, setCredentials, setHydrated } = authSlice.actions;
export default authSlice.reducer;
