import { ExternalProduct } from "@/types/nutrition";

interface OpenFoodFactProduct {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  image_front_small_url?: string;
  image_front_url?: string;
  image_url?: string;
  brands?: string;
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

interface BarcodeResponse {
  status?: number;
  product?: OpenFoodFactProduct;
}

function mapProduct(product: OpenFoodFactProduct): ExternalProduct | null {
  const calories = Number(product.nutriments?.["energy-kcal_100g"] ?? 0);
  const protein = Number(product.nutriments?.proteins_100g ?? 0);
  const carbs = Number(product.nutriments?.carbohydrates_100g ?? 0);
  const fats = Number(product.nutriments?.fat_100g ?? 0);
  const name = product.product_name?.trim() || product.product_name_en?.trim();
  const imageUrl =
    product.image_front_url ??
    product.image_front_small_url ??
    product.image_url;

  if (!product.code || !name || calories <= 0) {
    return null;
  }

  return {
    id: `off_${product.code}`,
    name,
    per100g: {
      calories,
      protein: Number(protein.toFixed(1)),
      carbs: Number(carbs.toFixed(1)),
      fats: Number(fats.toFixed(1)),
    },
    imageUrl,
  };
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
    .map((product): ExternalProduct | null => mapProduct(product))
    .filter((item): item is ExternalProduct => item !== null);
}

export async function getProductByBarcode(
  barcode: string,
): Promise<ExternalProduct | null> {
  const trimmed = barcode.trim();

  if (!trimmed) {
    return null;
  }

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(trimmed)}.json`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Barcode lookup failed");
  }

  const data = (await res.json()) as BarcodeResponse;

  if (data.status !== 1 || !data.product) {
    return null;
  }

  return mapProduct(data.product);
}
