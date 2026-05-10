import { api } from "./client";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  expiresIn: number;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await api.post("/auth/login", {
    email,
    password,
  });

  return res;
}

export async function register(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await api.post("/auth/register", {
    email,
    password,
  });

  return res;
}

export async function refreshToken(token: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  return api.post("/auth/refresh", token);
}

export async function logout(): Promise<void> {
  return api.post("/auth/logout");
}
