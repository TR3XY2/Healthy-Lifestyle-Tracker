import { api } from "./client";
import { StepCreateDto, StepsDay } from "@/types/steps";

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function getStepsHistory(
  from: Date,
  to: Date,
): Promise<StepsDay[]> {
  const query = `?from=${toDateOnly(from)}&to=${toDateOnly(to)}`;

  return api.get(`/steps${query}`);
}

export async function saveSteps(dto: StepCreateDto): Promise<StepsDay> {
  return api.post("/steps", dto);
}

export async function deleteSteps(date: string): Promise<void> {
  return api.delete(`/steps/${date}`);
}
