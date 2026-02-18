export interface WeightRecord {
  date: string; // ISO date string (e.g., "2026-01-15")
  weight: number;
}

export interface WeightCreateDto {
  date: string; // ISO date string
  weight: number;
}
