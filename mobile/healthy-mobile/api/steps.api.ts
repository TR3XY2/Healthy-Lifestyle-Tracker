import { api } from "./client";

function toDateOnly(date: Date) {
  return date.toISOString().split("T")[0];
}

export async function getStepsHistory(from: Date, to: Date) {
  const query = `?from=${toDateOnly(from)}&to=${toDateOnly(to)}`;

  return api.get(`/steps${query}`);
}
