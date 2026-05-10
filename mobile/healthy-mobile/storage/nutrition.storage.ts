import {
  Meal,
  NutritionEntry,
  NutritionGoals,
  NutritionStore,
  Product,
} from "@/types/nutrition";
import * as SecureStore from "expo-secure-store";

const PRODUCTS_KEY = "nutrition_products_v1";
const MEALS_KEY = "nutrition_meals_v1";
const ENTRIES_KEY = "nutrition_entries_v1";
const GOALS_KEY = "nutrition_goals_v1";

const DEFAULT_GOALS: NutritionGoals = {
  stepsGoal: 8000,
  calorieGoal: 2200,
};

const DEFAULT_STORE: NutritionStore = {
  products: [],
  meals: [],
  entries: [],
  goals: DEFAULT_GOALS,
};

function toNumberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeProduct(product: any): Product | null {
  if (!product || typeof product !== "object" || typeof product.id !== "string") {
    return null;
  }

  const per100g = product.per100g && typeof product.per100g === "object"
    ? {
        calories: toNumberOrZero(product.per100g.calories),
        protein: toNumberOrZero(product.per100g.protein),
        carbs: toNumberOrZero(product.per100g.carbs),
        fats: toNumberOrZero(product.per100g.fats),
      }
    : {
        // Backward compatibility for older flat product shape
        calories: toNumberOrZero(product.caloriesPer100g),
        protein: toNumberOrZero(product.proteinPer100g),
        carbs: toNumberOrZero(product.carbsPer100g),
        fats: toNumberOrZero(product.fatsPer100g),
      };

  return {
    id: product.id,
    name: typeof product.name === "string" ? product.name : "Unnamed product",
    source: product.source === "api" ? "api" : "custom",
    imageUrl: typeof product.imageUrl === "string" ? product.imageUrl : undefined,
    per100g,
  };
}

async function readStore(): Promise<NutritionStore> {
  try {
    const [productsRaw, mealsRaw, entriesRaw, goalsRaw] = await Promise.all([
      SecureStore.getItemAsync(PRODUCTS_KEY),
      SecureStore.getItemAsync(MEALS_KEY),
      SecureStore.getItemAsync(ENTRIES_KEY),
      SecureStore.getItemAsync(GOALS_KEY),
    ]);

    const products = productsRaw
      ? (JSON.parse(productsRaw) as any[])
          .map(normalizeProduct)
          .filter((product: Product | null): product is Product => product !== null)
      : [];
    const meals = mealsRaw ? JSON.parse(mealsRaw) : [];
    const entries = entriesRaw ? JSON.parse(entriesRaw) : [];
    const goals = goalsRaw
      ? JSON.parse(goalsRaw)
      : DEFAULT_GOALS;

    return { products, meals, entries, goals };
  } catch {
    return DEFAULT_STORE;
  }
}

async function writeStore(store: NutritionStore) {
  await Promise.all([
    SecureStore.setItemAsync(PRODUCTS_KEY, JSON.stringify(store.products)),
    SecureStore.setItemAsync(MEALS_KEY, JSON.stringify(store.meals)),
    SecureStore.setItemAsync(ENTRIES_KEY, JSON.stringify(store.entries)),
    SecureStore.setItemAsync(GOALS_KEY, JSON.stringify(store.goals)),
  ]);
}

export async function getNutritionStore() {
  return readStore();
}

export async function saveGoals(goals: NutritionGoals) {
  const store = await readStore();
  const next = { ...store, goals };
  await writeStore(next);
  return next.goals;
}

export async function saveProduct(product: Product) {
  const store = await readStore();
  const withoutExisting = store.products.filter((p) => p.id !== product.id);
  const next = { ...store, products: [product, ...withoutExisting] };
  await writeStore(next);
  return next.products;
}

export async function deleteProduct(productId: string) {
  const store = await readStore();
  const nextProducts = store.products.filter(
    (product) => product.id !== productId,
  );
  const nextMeals = store.meals
    .map((meal) => ({
      ...meal,
      items: meal.items.filter((item) => item.productId !== productId),
    }))
    .filter((meal) => meal.items.length > 0);
  const nextEntries = store.entries.filter(
    (entry) => entry.productId !== productId,
  );

  const next = {
    ...store,
    products: nextProducts,
    meals: nextMeals,
    entries: nextEntries,
  };

  await writeStore(next);
  return next;
}

export async function saveMeal(meal: Meal) {
  const store = await readStore();
  const withoutExisting = store.meals.filter((m) => m.id !== meal.id);
  const next = { ...store, meals: [meal, ...withoutExisting] };
  await writeStore(next);
  return next.meals;
}

export async function deleteMeal(mealId: string) {
  const store = await readStore();
  const nextMeals = store.meals.filter((meal) => meal.id !== mealId);
  const nextEntries = store.entries.filter((entry) => entry.mealId !== mealId);

  const next = {
    ...store,
    meals: nextMeals,
    entries: nextEntries,
  };

  await writeStore(next);
  return next;
}

export async function saveEntry(entry: NutritionEntry) {
  const store = await readStore();
  const withoutExisting = store.entries.filter((e) => e.id !== entry.id);
  const next = { ...store, entries: [entry, ...withoutExisting] };
  await writeStore(next);
  return next.entries;
}

export async function deleteEntry(entryId: string) {
  const store = await readStore();
  const next = {
    ...store,
    entries: store.entries.filter((entry) => entry.id !== entryId),
  };

  await writeStore(next);
  return next.entries;
}
