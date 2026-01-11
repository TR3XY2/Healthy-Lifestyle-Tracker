import { apiFetch } from "./client";

export async function login(email: string, password: string) {
  return apiFetch<{ token: string; expires: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string) {
  return apiFetch<void>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
