import { api } from "./client";
import { WeightCreateDto, WeightRecord } from "../types/weight";

export async function getWeightHistory(): Promise<WeightRecord[]> {
  return api.get("/weight");
}

export async function addWeight(dto: WeightCreateDto): Promise<WeightRecord> {
  return api.post("/weight", dto);
}

export async function deleteWeight(date: string): Promise<void> {
  // Convert date format from YYYY-MM-DD to the format expected by the API
  return api.delete(`/weight/${date}`);
}
