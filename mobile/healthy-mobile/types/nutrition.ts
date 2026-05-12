export interface MacroValues {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Product {
  id: string;
  name: string;
  source: "custom" | "api";
  per100g: MacroValues;
  imageUrl?: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "other";

export interface MealItem {
  productId: string;
  grams: number;
}

export interface Meal {
  id: string;
  name: string;
  items: MealItem[];
}

export interface NutritionEntry {
  id: string;
  date: string;
  type: "product" | "meal";
  productId?: string;
  mealId?: string;
  grams?: number;
  servings?: number;
  mealType?: MealType;
}

export interface NutritionGoals {
  stepsGoal: number;
  calorieGoal: number;
}

export interface NutritionStore {
  products: Product[];
  meals: Meal[];
  entries: NutritionEntry[];
  goals: NutritionGoals;
}

export interface ExternalProduct {
  id: string;
  name: string;
  per100g: MacroValues;
  imageUrl?: string;
}

export type InsightTone = "positive" | "warning" | "info";

export interface NutritionInsight {
  id: string;
  // Prefer i18n keys when available. Legacy `title`/`message` kept for compatibility.
  title?: string;
  message?: string;
  action?: string;
  titleKey?: string;
  messageKey?: string;
  actionKey?: string;
  params?: Record<string, string | number>;
  tone: InsightTone;
}
