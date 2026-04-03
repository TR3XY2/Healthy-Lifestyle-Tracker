import { useNutrition } from "@/hooks/useNutrition";
import { ExternalProduct } from "@/types/nutrition";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function NutritionScreen() {
  const {
    loading,
    products,
    meals,
    todayEntries,
    todaysTotals,
    refresh,
    searchExternalProducts,
    importExternalProduct,
    addCustomProduct,
    addMeal,
    addProductEntry,
    addMealEntry,
  } = useNutrition();

  const [searchInput, setSearchInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ExternalProduct[]>([]);

  const [productName, setProductName] = useState("");
  const [productCalories, setProductCalories] = useState("");
  const [productProtein, setProductProtein] = useState("");
  const [productCarbs, setProductCarbs] = useState("");
  const [productFats, setProductFats] = useState("");

  const [mealName, setMealName] = useState("");
  const [mealProductId, setMealProductId] = useState<string | null>(null);
  const [mealGrams, setMealGrams] = useState("100");
  const [mealItems, setMealItems] = useState<
    { productId: string; grams: number }[]
  >([]);

  const [entryType, setEntryType] = useState<"product" | "meal">("product");
  const [entryRefId, setEntryRefId] = useState<string | null>(null);
  const [entryAmount, setEntryAmount] = useState("100");

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  async function onSearchProducts() {
    if (!searchInput.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const found = await searchExternalProducts(searchInput);
      setSearchResults(found.slice(0, 8));
    } catch (error: any) {
      Alert.alert("Search failed", error?.message ?? "Please try again.");
    } finally {
      setSearchLoading(false);
    }
  }

  async function onImportProduct(item: ExternalProduct) {
    try {
      await importExternalProduct(item);
      Alert.alert("Added", `${item.name} was added to your products.`);
    } catch (error: any) {
      Alert.alert("Add failed", error?.message ?? "Please try again.");
    }
  }

  async function onCreateCustomProduct() {
    const calories = Number(productCalories);
    const protein = Number(productProtein || 0);
    const carbs = Number(productCarbs || 0);
    const fats = Number(productFats || 0);

    if (!productName.trim() || calories <= 0) {
      Alert.alert("Invalid product", "Provide name and calories per 100g.");
      return;
    }

    try {
      await addCustomProduct(productName, {
        calories,
        protein,
        carbs,
        fats,
      });

      setProductName("");
      setProductCalories("");
      setProductProtein("");
      setProductCarbs("");
      setProductFats("");
      Alert.alert("Saved", "Custom product added.");
    } catch (error: any) {
      Alert.alert("Save failed", error?.message ?? "Please try again.");
    }
  }

  function onAddMealItem() {
    const grams = Number(mealGrams);
    if (!mealProductId || grams <= 0) {
      Alert.alert("Invalid item", "Choose a product and grams.");
      return;
    }

    setMealItems((prev) => [...prev, { productId: mealProductId, grams }]);
    setMealProductId(null);
    setMealGrams("100");
  }

  async function onCreateMeal() {
    if (!mealName.trim() || mealItems.length === 0) {
      Alert.alert("Invalid meal", "Provide a meal name and at least one item.");
      return;
    }

    try {
      await addMeal(mealName, mealItems);
      setMealName("");
      setMealItems([]);
      Alert.alert("Saved", "Meal created successfully.");
    } catch (error: any) {
      Alert.alert("Save failed", error?.message ?? "Please try again.");
    }
  }

  async function onAddEntry() {
    const amount = Number(entryAmount);

    if (!entryRefId || amount <= 0) {
      Alert.alert("Invalid entry", "Choose item and amount.");
      return;
    }

    try {
      if (entryType === "product") {
        await addProductEntry(entryRefId, amount);
      } else {
        await addMealEntry(entryRefId, amount);
      }

      setEntryRefId(null);
      setEntryAmount(entryType === "product" ? "100" : "1");
      Alert.alert("Added", "Nutrition entry saved for today.");
    } catch (error: any) {
      Alert.alert("Save failed", error?.message ?? "Please try again.");
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
    >
      <View
        style={{
          backgroundColor: "#0f172a",
          borderRadius: 18,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#cbd5e1", marginBottom: 4 }}>Today</Text>
        <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>
          {Math.round(todaysTotals.calories)} kcal
        </Text>
        <Text style={{ color: "#cbd5e1", marginTop: 4 }}>
          Protein {todaysTotals.protein.toFixed(1)}g · Carbs{" "}
          {todaysTotals.carbs.toFixed(1)}g · Fats {todaysTotals.fats.toFixed(1)}
          g
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginVertical: 20 }} />
      ) : (
        <>
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 14,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              Import products
            </Text>
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Search food products"
              style={{
                borderWidth: 1,
                borderColor: "#cbd5e1",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            />
            <Pressable
              onPress={onSearchProducts}
              style={{
                backgroundColor: "#0ea5e9",
                borderRadius: 10,
                marginTop: 8,
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                {searchLoading ? "Searching..." : "Search"}
              </Text>
            </Pressable>

            {searchResults.map((result) => (
              <Pressable
                key={result.id}
                onPress={() => onImportProduct(result)}
                style={{
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  borderRadius: 10,
                  marginTop: 8,
                  padding: 10,
                }}
              >
                <Text style={{ fontWeight: "700" }}>{result.name}</Text>
                <Text style={{ color: "#334155", marginTop: 3 }}>
                  {Math.round(result.per100g.calories)} kcal · P{" "}
                  {result.per100g.protein}g · C {result.per100g.carbs}g · F{" "}
                  {result.per100g.fats}g
                </Text>
              </Pressable>
            ))}
          </View>

          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 14,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              Add custom product (per 100g)
            </Text>
            <TextInput
              value={productName}
              onChangeText={setProductName}
              placeholder="Product name"
              style={fieldStyle}
            />
            <TextInput
              value={productCalories}
              onChangeText={setProductCalories}
              keyboardType="decimal-pad"
              placeholder="Calories"
              style={fieldStyle}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                value={productProtein}
                onChangeText={setProductProtein}
                keyboardType="decimal-pad"
                placeholder="Protein"
                style={[fieldStyle, { flex: 1 }]}
              />
              <TextInput
                value={productCarbs}
                onChangeText={setProductCarbs}
                keyboardType="decimal-pad"
                placeholder="Carbs"
                style={[fieldStyle, { flex: 1 }]}
              />
              <TextInput
                value={productFats}
                onChangeText={setProductFats}
                keyboardType="decimal-pad"
                placeholder="Fats"
                style={[fieldStyle, { flex: 1 }]}
              />
            </View>
            <Pressable onPress={onCreateCustomProduct} style={primaryButton}>
              <Text style={primaryButtonText}>Save product</Text>
            </Pressable>
          </View>

          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 14,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              Create meal
            </Text>
            <TextInput
              value={mealName}
              onChangeText={setMealName}
              placeholder="Meal name"
              style={fieldStyle}
            />

            <Text style={{ color: "#334155", marginBottom: 6 }}>
              Select product
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 8,
              }}
            >
              {products.slice(0, 16).map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() => setMealProductId(product.id)}
                  style={[
                    {
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderWidth: 1,
                    },
                    mealProductId === product.id
                      ? { borderColor: "#0ea5e9", backgroundColor: "#e0f2fe" }
                      : { borderColor: "#cbd5e1", backgroundColor: "#f8fafc" },
                  ]}
                >
                  <Text style={{ fontSize: 12 }}>{product.name}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={mealGrams}
              onChangeText={setMealGrams}
              keyboardType="decimal-pad"
              placeholder="Grams in meal"
              style={fieldStyle}
            />
            <Pressable onPress={onAddMealItem} style={secondaryButton}>
              <Text style={secondaryButtonText}>Add meal item</Text>
            </Pressable>

            {mealItems.map((item, index) => {
              const product = productMap.get(item.productId);
              return (
                <Text
                  key={`${item.productId}_${index}`}
                  style={{ color: "#334155", marginTop: 6 }}
                >
                  • {product?.name ?? item.productId} — {item.grams}g
                </Text>
              );
            })}

            <Pressable onPress={onCreateMeal} style={primaryButton}>
              <Text style={primaryButtonText}>Save meal</Text>
            </Pressable>
          </View>

          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 14,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              Log intake for today
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => {
                  setEntryType("product");
                  setEntryAmount("100");
                }}
                style={[
                  entryType === "product" ? primaryButton : secondaryButton,
                  { flex: 1 },
                ]}
              >
                <Text
                  style={
                    entryType === "product"
                      ? primaryButtonText
                      : secondaryButtonText
                  }
                >
                  Product
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setEntryType("meal");
                  setEntryAmount("1");
                }}
                style={[
                  entryType === "meal" ? primaryButton : secondaryButton,
                  { flex: 1 },
                ]}
              >
                <Text
                  style={
                    entryType === "meal"
                      ? primaryButtonText
                      : secondaryButtonText
                  }
                >
                  Meal
                </Text>
              </Pressable>
            </View>

            <TextInput
              editable={false}
              value={
                entryType === "product"
                  ? entryRefId
                    ? (productMap.get(entryRefId)?.name ?? "")
                    : ""
                  : entryRefId
                    ? (meals.find((meal) => meal.id === entryRefId)?.name ?? "")
                    : ""
              }
              placeholder={
                entryType === "product"
                  ? "Select product below"
                  : "Select meal below"
              }
              style={[fieldStyle, { backgroundColor: "#f8fafc" }]}
            />

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 8,
              }}
            >
              {(entryType === "product" ? products : meals)
                .slice(0, 20)
                .map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setEntryRefId(item.id)}
                    style={[
                      {
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderWidth: 1,
                      },
                      entryRefId === item.id
                        ? { borderColor: "#0ea5e9", backgroundColor: "#e0f2fe" }
                        : {
                            borderColor: "#cbd5e1",
                            backgroundColor: "#f8fafc",
                          },
                    ]}
                  >
                    <Text style={{ fontSize: 12 }}>{item.name}</Text>
                  </Pressable>
                ))}
            </View>

            <TextInput
              value={entryAmount}
              onChangeText={setEntryAmount}
              keyboardType="decimal-pad"
              placeholder={entryType === "product" ? "Grams" : "Servings"}
              style={fieldStyle}
            />
            <Pressable onPress={onAddEntry} style={primaryButton}>
              <Text style={primaryButtonText}>Add to today</Text>
            </Pressable>
          </View>

          <View
            style={{ backgroundColor: "white", borderRadius: 16, padding: 14 }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              Your library
            </Text>
            <Text style={{ fontWeight: "700", marginTop: 4 }}>Products</Text>
            {products.length === 0 ? (
              <Text style={{ color: "#64748b" }}>No products yet.</Text>
            ) : (
              products.slice(0, 12).map((product) => (
                <Text
                  key={product.id}
                  style={{ color: "#334155", marginTop: 4 }}
                >
                  {product.name}
                </Text>
              ))
            )}

            <Text style={{ fontWeight: "700", marginTop: 10 }}>Meals</Text>
            {meals.length === 0 ? (
              <Text style={{ color: "#64748b" }}>No meals yet.</Text>
            ) : (
              meals.slice(0, 12).map((meal) => (
                <Text key={meal.id} style={{ color: "#334155", marginTop: 4 }}>
                  {meal.name}
                </Text>
              ))
            )}

            <Text style={{ fontWeight: "700", marginTop: 10 }}>
              Today entries
            </Text>
            <Text style={{ color: "#334155", marginTop: 4 }}>
              {todayEntries.length} logged item(s)
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const fieldStyle = {
  borderWidth: 1,
  borderColor: "#cbd5e1",
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  marginBottom: 8,
};

const primaryButton = {
  backgroundColor: "#0ea5e9",
  borderRadius: 10,
  paddingVertical: 11,
  marginTop: 8,
};

const primaryButtonText = {
  color: "white",
  textAlign: "center" as const,
  fontWeight: "700" as const,
};

const secondaryButton = {
  backgroundColor: "#e2e8f0",
  borderRadius: 10,
  paddingVertical: 11,
  marginTop: 8,
};

const secondaryButtonText = {
  color: "#0f172a",
  textAlign: "center" as const,
  fontWeight: "700" as const,
};
