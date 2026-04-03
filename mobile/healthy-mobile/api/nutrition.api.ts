import { ExternalProduct } from "@/types/nutrition";

interface OpenFoodFactProduct {
  code?: string;
  product_name?: string;
  nutriments?: {
    [key: string]: number | undefined;
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

interface SearchResponse {
  products?: OpenFoodFactProduct[];
}

export async function searchProducts(
  query: string,
): Promise<ExternalProduct[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(trimmed)}&search_simple=1&action=process&json=1&page_size=12`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Product search failed");
  }

  const data = (await res.json()) as SearchResponse;

  return (data.products ?? [])
    .map((product) => {
      const calories = Number(product.nutriments?.["energy-kcal_100g"] ?? 0);
      const protein = Number(product.nutriments?.proteins_100g ?? 0);
      const carbs = Number(product.nutriments?.carbohydrates_100g ?? 0);
      const fats = Number(product.nutriments?.fat_100g ?? 0);

      if (!product.code || !product.product_name || calories <= 0) {
        return null;
      }

      return {
        id: `off_${product.code}`,
        name: product.product_name,
        per100g: {
          calories,
          protein: Number(protein.toFixed(1)),
          carbs: Number(carbs.toFixed(1)),
          fats: Number(fats.toFixed(1)),
        },
      };
    })
    .filter((item): item is ExternalProduct => item !== null);
}
