import { api } from "./client";
import { UserProfile } from "@/types/profile";

export async function getProfile(): Promise<UserProfile | null> {
  return api.get("/profile");
}

export async function updateHeight(heightCm: number): Promise<void> {
  return api.put("/profile/height", heightCm);
}
