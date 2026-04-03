import {
  Meal,
  NutritionEntry,
  NutritionGoals,
  NutritionStore,
  Product,
} from "@/types/nutrition";
import * as SecureStore from "expo-secure-store";

const KEY = "nutrition_store_v1";

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

async function readStore(): Promise<NutritionStore> {
  const raw = await SecureStore.getItemAsync(KEY);

  if (!raw) {
    return DEFAULT_STORE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<NutritionStore>;

    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      meals: Array.isArray(parsed.meals) ? parsed.meals : [],
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      goals: {
        stepsGoal: parsed.goals?.stepsGoal ?? DEFAULT_GOALS.stepsGoal,
        calorieGoal: parsed.goals?.calorieGoal ?? DEFAULT_GOALS.calorieGoal,
      },
    };
  } catch {
    return DEFAULT_STORE;
  }
}

async function writeStore(store: NutritionStore) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(store));
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

export async function saveMeal(meal: Meal) {
  const store = await readStore();
  const withoutExisting = store.meals.filter((m) => m.id !== meal.id);
  const next = { ...store, meals: [meal, ...withoutExisting] };
  await writeStore(next);
  return next.meals;
}

export async function saveEntry(entry: NutritionEntry) {
  const store = await readStore();
  const next = { ...store, entries: [entry, ...store.entries] };
  await writeStore(next);
  return next.entries;
}
