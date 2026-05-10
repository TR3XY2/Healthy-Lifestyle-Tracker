import {
  getNutritionStore,
  saveEntry,
  saveProduct,
} from "@/storage/nutrition.storage";
import * as NutritionApi from "@/api/nutrition-backend.api";

interface SyncState {
  lastSyncTime: number;
  isSyncing: boolean;
  pendingEntries: any[];
  pendingProducts: any[];
  syncedAt: Date | null;
}

const DEFAULT_SYNC_STATE: SyncState = {
  lastSyncTime: 0,
  isSyncing: false,
  pendingEntries: [],
  pendingProducts: [],
  syncedAt: null,
};

function extractPer100g(product: any) {
  if (!product || typeof product !== "object") {
    return null;
  }

  if (product.per100g && typeof product.per100g === "object") {
    const p = product.per100g;
    if (
      typeof p.calories === "number" &&
      typeof p.protein === "number" &&
      typeof p.carbs === "number" &&
      typeof p.fats === "number"
    ) {
      return p;
    }
  }

  if (
    typeof product.caloriesPer100g === "number" &&
    typeof product.proteinPer100g === "number" &&
    typeof product.carbsPer100g === "number" &&
    typeof product.fatsPer100g === "number"
  ) {
    return {
      calories: product.caloriesPer100g,
      protein: product.proteinPer100g,
      carbs: product.carbsPer100g,
      fats: product.fatsPer100g,
    };
  }

  return null;
}

export class SyncManager {
  private syncState: SyncState = DEFAULT_SYNC_STATE;

  async initialize() {
    // Load sync state from storage if available
    // For now, just use default
  }

  async syncNutritionData(): Promise<boolean> {
    try {
      if (this.syncState.isSyncing) {
        console.log("Sync already in progress");
        return false;
      }

      this.syncState.isSyncing = true;

      // 1. Get local data
      const store = await getNutritionStore();

      // 2. Upload products to backend
      const localToSyncedProduct = new Map<string, any>();
      for (const product of store.products) {
        try {
          if (!product.id.startsWith("synced_")) {
            const per100g = extractPer100g(product);
            if (!per100g) {
              throw new Error(`Invalid product macro shape for ${product.id}`);
            }

            // New product - create on backend
            const created = await NutritionApi.createProduct({
              name: product.name,
              imageUrl: product.imageUrl,
              caloriesPer100g: per100g.calories,
              proteinPer100g: per100g.protein,
              carbsPer100g: per100g.carbs,
              fatsPer100g: per100g.fats,
              source: product.source || "custom",
            });

            // Update local product with backend ID
            const updatedProduct = { ...product, id: `synced_${created.id}` };
            await saveProduct(updatedProduct);
            // Remember mapping from original local id -> updated product
            localToSyncedProduct.set(product.id, updatedProduct);
          }
        } catch (error) {
          console.error(`Failed to sync product ${product.id}:`, error);
          // Continue with other products
        }
      }

      // 3. Upload entries to backend
      // Reload store to pick up any product ID changes performed by saveProduct
      const postProductStore = await getNutritionStore();
      // Build lookup maps for products and meals to compute macros
      const productMap = new Map(postProductStore.products.map((p: any) => [p.id, p]));
      // Also add mappings from original local ids to the newly synced product objects
      for (const [localId, syncedProduct] of localToSyncedProduct.entries()) {
        if (!productMap.has(localId)) {
          productMap.set(localId, syncedProduct);
        }
      }
      const mealMap = new Map(postProductStore.meals.map((m: any) => [m.id, m]));

      for (const entry of postProductStore.entries) {
        try {
          if (!entry.id.startsWith("synced_")) {
            // Compute macros depending on entry type
            let macros = { calories: 0, protein: 0, carbs: 0, fats: 0 };

            if (entry.type === "product") {
              const product = productMap.get(entry.productId);
              if (!product) {
                throw new Error(`Product not found for entry ${entry.id} (productId=${entry.productId})`);
              }
              const per100g = extractPer100g(product);
              if (!per100g) {
                throw new Error(`Invalid macro shape for product ${product.id} in entry ${entry.id}`);
              }
              const factor = (entry.grams ?? 0) / 100;
              macros = {
                calories: Number((per100g.calories * factor).toFixed(1)),
                protein: Number((per100g.protein * factor).toFixed(1)),
                carbs: Number((per100g.carbs * factor).toFixed(1)),
                fats: Number((per100g.fats * factor).toFixed(1)),
              };
            } else if (entry.type === "meal") {
              const meal = mealMap.get(entry.mealId);
              if (!meal) {
                throw new Error(`Meal not found for entry ${entry.id} (mealId=${entry.mealId})`);
              }
              // Sum macros for meal items
              let mealMacro = { calories: 0, protein: 0, carbs: 0, fats: 0 };
              for (const item of meal.items) {
                const product = productMap.get(item.productId);
                if (!product) {
                  throw new Error(`Product not found for meal item ${item.productId} in meal ${meal.id}`);
                }
                const per100g = extractPer100g(product);
                if (!per100g) {
                  throw new Error(`Invalid macro shape for meal item product ${item.productId} in meal ${meal.id}`);
                }
                const factor = item.grams / 100;
                mealMacro.calories += per100g.calories * factor;
                mealMacro.protein += per100g.protein * factor;
                mealMacro.carbs += per100g.carbs * factor;
                mealMacro.fats += per100g.fats * factor;
              }
              const servings = entry.servings ?? 1;
              macros = {
                calories: Number((mealMacro.calories * servings).toFixed(1)),
                protein: Number((mealMacro.protein * servings).toFixed(1)),
                carbs: Number((mealMacro.carbs * servings).toFixed(1)),
                fats: Number((mealMacro.fats * servings).toFixed(1)),
              };
            } else {
              throw new Error(`Unknown entry type for ${entry.id}: ${entry.type}`);
            }

            // New entry - create on backend
            const created = await NutritionApi.logEntry({
              date: entry.date,
              mealType: entry.mealType ?? "other",
              calories: macros.calories,
              protein: macros.protein,
              carbs: macros.carbs,
              fats: macros.fats,
            });

            // Update local entry with backend ID
            const updatedEntry = { ...entry, id: `synced_${created.id}` };
            await saveEntry(updatedEntry);
          }
        } catch (error) {
          console.error(`Failed to sync entry ${entry.id}:`, error);
          // Continue with other entries
        }
      }

      // 4. Sync goals
      try {
        if (store.goals) {
          await NutritionApi.updateGoals({
            calorieGoal: store.goals.calorieGoal,
            stepsGoal: store.goals.stepsGoal,
          });
        }
      } catch (error) {
        console.error("Failed to sync goals:", error);
      }

      this.syncState.isSyncing = false;
      this.syncState.lastSyncTime = Date.now();
      this.syncState.syncedAt = new Date();

      console.log("Nutrition data synced successfully");
      return true;
    } catch (error) {
      console.error("Sync failed:", error);
      this.syncState.isSyncing = false;
      return false;
    }
  }

  isSyncing(): boolean {
    return this.syncState.isSyncing;
  }

  getLastSyncTime(): Date | null {
    return this.syncState.syncedAt;
  }

  getSyncState(): SyncState {
    return { ...this.syncState };
  }
}

export const syncManager = new SyncManager();
