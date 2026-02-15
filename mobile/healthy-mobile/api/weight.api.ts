import { api } from "./client";

export async function getWeightHistory() {
  return api.get("/weight");
}
