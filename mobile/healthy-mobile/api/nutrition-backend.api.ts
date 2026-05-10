import { api } from "./client";
import { ExternalProduct } from "@/types/nutrition";

export interface Product {
  id: string;
  name: string;
  imageUrl?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionEntry {
  id: string;
  date: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionGoals {
  id: string;
  calorieGoal: number;
  stepsGoal: number;
  updatedAt: string;
}

// Products
export async function createProduct(data: {
  name: string;
  imageUrl?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  source?: string;
}): Promise<Product> {
  return api.post("/nutrition/products", data);
}

export async function getProduct(id: string): Promise<Product> {
  return api.get(`/nutrition/products/${id}`);
}

export async function getUserProducts(): Promise<Product[]> {
  return api.get("/nutrition/products");
}

export async function deleteProduct(id: string): Promise<void> {
  return api.delete(`/nutrition/products/${id}`);
}

// Entries
export async function logEntry(data: {
  date: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}): Promise<NutritionEntry> {
  return api.post("/nutrition/entries", data);
}

export async function getEntries(
  from: string,
  to: string,
): Promise<NutritionEntry[]> {
  return api.get(`/nutrition/entries?from=${from}&to=${to}`);
}

export async function deleteEntry(id: string): Promise<void> {
  return api.delete(`/nutrition/entries/${id}`);
}

// Goals
export async function getGoals(): Promise<NutritionGoals> {
  return api.get("/nutrition/goals");
}

export async function updateGoals(data: {
  calorieGoal: number;
  stepsGoal: number;
}): Promise<NutritionGoals> {
  return api.put("/nutrition/goals", data);
}
