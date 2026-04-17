import { searchProducts } from "@/api/nutrition.api";
import {
  deleteEntry,
  deleteMeal,
  deleteProduct,
  getNutritionStore,
  saveEntry,
  saveGoals,
  saveMeal,
  saveProduct,
} from "@/storage/nutrition.storage";
import {
  ExternalProduct,
  MacroValues,
  Meal,
  MealItem,
  MealType,
  NutritionEntry,
  NutritionGoals,
  Product,
} from "@/types/nutrition";
import { useCallback, useMemo, useState } from "react";

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function scaleMacro(per100g: MacroValues, grams: number): MacroValues {
  const factor = grams / 100;

  return {
    calories: Number((per100g.calories * factor).toFixed(1)),
    protein: Number((per100g.protein * factor).toFixed(1)),
    carbs: Number((per100g.carbs * factor).toFixed(1)),
    fats: Number((per100g.fats * factor).toFixed(1)),
  };
}

function addMacro(base: MacroValues, extra: MacroValues): MacroValues {
  return {
    calories: Number((base.calories + extra.calories).toFixed(1)),
    protein: Number((base.protein + extra.protein).toFixed(1)),
    carbs: Number((base.carbs + extra.carbs).toFixed(1)),
    fats: Number((base.fats + extra.fats).toFixed(1)),
  };
}

const EMPTY_MACRO: MacroValues = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
};

export function useNutrition() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>({
    stepsGoal: 8000,
    calorieGoal: 2200,
  });

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const store = await getNutritionStore();
      setProducts(store.products);
      setMeals(store.meals);
      setEntries(store.entries);
      setGoals(store.goals);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchExternalProducts = useCallback(async (query: string) => {
    return searchProducts(query);
  }, []);

  const importExternalProduct = useCallback(
    async (external: ExternalProduct) => {
      const product: Product = {
        id: external.id,
        name: external.name,
        source: "api",
        per100g: external.per100g,
        imageUrl: external.imageUrl,
      };

      const saved = await saveProduct(product);
      setProducts(saved);
      return product;
    },
    [],
  );

  const addCustomProduct = useCallback(
    async (name: string, per100g: MacroValues) => {
      const product: Product = {
        id: createId("prod"),
        name: name.trim(),
        source: "custom",
        per100g,
      };

      const saved = await saveProduct(product);
      setProducts(saved);
      return product;
    },
    [],
  );

  const addMeal = useCallback(async (name: string, items: MealItem[]) => {
    const meal: Meal = {
      id: createId("meal"),
      name: name.trim(),
      items,
    };

    const saved = await saveMeal(meal);
    setMeals(saved);
    return meal;
  }, []);

  const addProductEntry = useCallback(
    async (
      productId: string,
      grams: number,
      date = toDateOnly(new Date()),
      mealType: MealType = "other",
    ) => {
      const entry: NutritionEntry = {
        id: createId("entry"),
        date,
        type: "product",
        productId,
        grams,
        mealType,
      };

      const saved = await saveEntry(entry);
      setEntries(saved);
      return entry;
    },
    [],
  );

  const addMealEntry = useCallback(
    async (
      mealId: string,
      servings: number,
      date = toDateOnly(new Date()),
      mealType: MealType = "other",
    ) => {
      const entry: NutritionEntry = {
        id: createId("entry"),
        date,
        type: "meal",
        mealId,
        servings,
        mealType,
      };

      const saved = await saveEntry(entry);
      setEntries(saved);
      return entry;
    },
    [],
  );

  const updateGoals = useCallback(async (nextGoals: NutritionGoals) => {
    const saved = await saveGoals(nextGoals);
    setGoals(saved);
    return saved;
  }, []);

  const removeProduct = useCallback(async (productId: string) => {
    const next = await deleteProduct(productId);
    setProducts(next.products);
    setMeals(next.meals);
    setEntries(next.entries);
  }, []);

  const removeMeal = useCallback(async (mealId: string) => {
    const next = await deleteMeal(mealId);
    setMeals(next.meals);
    setEntries(next.entries);
  }, []);

  const removeEntry = useCallback(async (entryId: string) => {
    const next = await deleteEntry(entryId);
    setEntries(next);
  }, []);

  const today = toDateOnly(new Date());

  const mealMacroMap = useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]));
    const map = new Map<string, MacroValues>();

    for (const meal of meals) {
      const total = meal.items.reduce((acc, item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          return acc;
        }

        return addMacro(acc, scaleMacro(product.per100g, item.grams));
      }, EMPTY_MACRO);

      map.set(meal.id, total);
    }

    return map;
  }, [meals, products]);

  const todaysTotals = useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]));

    return entries
      .filter((entry) => entry.date === today)
      .reduce((acc, entry) => {
        if (entry.type === "product") {
          const product = entry.productId
            ? productMap.get(entry.productId)
            : null;
          if (!product) {
            return acc;
          }

          return addMacro(acc, scaleMacro(product.per100g, entry.grams ?? 0));
        }

        const mealMacro = entry.mealId ? mealMacroMap.get(entry.mealId) : null;
        if (!mealMacro) {
          return acc;
        }

        const servings = entry.servings ?? 1;
        return addMacro(acc, {
          calories: mealMacro.calories * servings,
          protein: mealMacro.protein * servings,
          carbs: mealMacro.carbs * servings,
          fats: mealMacro.fats * servings,
        });
      }, EMPTY_MACRO);
  }, [entries, mealMacroMap, products, today]);

  const todayEntries = useMemo(
    () => entries.filter((entry) => entry.date === today),
    [entries, today],
  );

  return {
    loading,
    products,
    meals,
    entries,
    goals,
    todayEntries,
    todaysTotals,
    refresh,
    searchExternalProducts,
    importExternalProduct,
    addCustomProduct,
    addMeal,
    addProductEntry,
    addMealEntry,
    updateGoals,
    removeProduct,
    removeMeal,
    removeEntry,
  };
}
