export interface StepsDay {
  date: string;
  steps: number;
  calories: number;
  weightUsed: number | null;
  weightDate: string | null;
}

export interface StepCreateDto {
  date: string;
  steps: number;
}
