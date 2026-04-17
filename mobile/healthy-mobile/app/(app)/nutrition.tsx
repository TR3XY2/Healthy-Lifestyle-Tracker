import { useNutrition } from "@/hooks/useNutrition";
import {
  ExternalProduct,
  MacroValues,
  MealType,
  NutritionEntry,
  Product,
} from "@/types/nutrition";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type EntrySummary = {
  id: string;
  date: string;
  title: string;
  detail: string;
  macros: MacroValues;
  mealTypeLabel: string;
  imageUrl?: string;
  sourceLabel: string;
  type: NutritionEntry["type"];
};

type DateGroup = {
  date: string;
  items: EntrySummary[];
  totals: MacroValues;
};

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "other", label: "Other" },
];

const EMPTY_MACRO: MacroValues = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
};

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatMealType(mealType?: MealType) {
  if (!mealType) {
    return "Other";
  }

  return (
    MEAL_TYPE_OPTIONS.find((option) => option.value === mealType)?.label ??
    "Other"
  );
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

function parsePositiveNumber(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function isValidDateOnly(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T12:00:00`).getTime())
  );
}

export default function NutritionScreen() {
  const {
    loading,
    products,
    meals,
    entries,
    todayEntries,
    todaysTotals,
    refresh,
    searchExternalProducts,
    importExternalProduct,
    addCustomProduct,
    addMeal,
    addProductEntry,
    addMealEntry,
    removeProduct,
    removeMeal,
    removeEntry,
  } = useNutrition();

  const [searchInput, setSearchInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ExternalProduct[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(
    toDateOnly(new Date()),
  );
  const [selectedMealType, setSelectedMealType] =
    useState<MealType>("breakfast");

  const [activeProduct, setActiveProduct] = useState<ExternalProduct | null>(
    null,
  );
  const [activeProductGrams, setActiveProductGrams] = useState("100");

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

  const mealMap = useMemo(
    () => new Map(meals.map((meal) => [meal.id, meal])),
    [meals],
  );

  const mealMacroMap = useMemo(() => {
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
  }, [meals, productMap]);

  const entrySummaries = useMemo<EntrySummary[]>(() => {
    return entries.map((entry) => {
      const mealTypeLabel = formatMealType(entry.mealType);

      if (entry.type === "product") {
        const product = entry.productId
          ? productMap.get(entry.productId)
          : null;
        const amount = entry.grams ?? 0;

        return {
          id: entry.id,
          date: entry.date,
          title: product?.name ?? "Deleted product",
          detail: `${amount}g`,
          macros: product ? scaleMacro(product.per100g, amount) : EMPTY_MACRO,
          mealTypeLabel,
          imageUrl: product?.imageUrl,
          sourceLabel: "Product",
          type: entry.type,
        };
      }

      const meal = entry.mealId ? mealMap.get(entry.mealId) : null;
      const mealMacro = meal
        ? (mealMacroMap.get(meal.id) ?? EMPTY_MACRO)
        : EMPTY_MACRO;
      const servings = entry.servings ?? 1;

      return {
        id: entry.id,
        date: entry.date,
        title: meal?.name ?? "Deleted meal",
        detail: `${servings} serving${servings === 1 ? "" : "s"}`,
        macros: {
          calories: Number((mealMacro.calories * servings).toFixed(1)),
          protein: Number((mealMacro.protein * servings).toFixed(1)),
          carbs: Number((mealMacro.carbs * servings).toFixed(1)),
          fats: Number((mealMacro.fats * servings).toFixed(1)),
        },
        mealTypeLabel,
        sourceLabel: "Meal",
        type: entry.type,
      };
    });
  }, [entries, mealMacroMap, mealMap, productMap]);

  const historyGroups = useMemo<DateGroup[]>(() => {
    const grouped = new Map<string, EntrySummary[]>();

    for (const summary of entrySummaries) {
      const list = grouped.get(summary.date) ?? [];
      list.push(summary);
      grouped.set(summary.date, list);
    }

    return Array.from(grouped.entries())
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([date, items]) => ({
        date,
        items,
        totals: items.reduce(
          (acc, item) => addMacro(acc, item.macros),
          EMPTY_MACRO,
        ),
      }));
  }, [entrySummaries]);

  const selectedDayEntries = useMemo(
    () => entrySummaries.filter((entry) => entry.date === selectedDate),
    [entrySummaries, selectedDate],
  );

  const selectedDayTotals = useMemo(
    () =>
      selectedDayEntries.reduce(
        (acc, item) => addMacro(acc, item.macros),
        EMPTY_MACRO,
      ),
    [selectedDayEntries],
  );

  const quickDateChips = historyGroups.slice(0, 6);

  async function onSearchProducts() {
    if (!searchInput.trim()) {
      setSearchResults([]);
      setSearchMessage(null);
      return;
    }

    setSearchLoading(true);
    setSearchMessage(null);

    try {
      const found = await searchExternalProducts(searchInput);
      const nextResults = found.slice(0, 8);
      setSearchResults(nextResults);
      setSearchMessage(
        nextResults.length === 0 ? "Nothing found. Try another name." : null,
      );
    } catch (error: any) {
      setSearchResults([]);
      setSearchMessage(error?.message ?? "Search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  }

  async function onSaveExternalProduct(item: ExternalProduct) {
    try {
      await importExternalProduct(item);
      Alert.alert("Added", `${item.name} was added to your products.`);
    } catch (error: any) {
      Alert.alert("Add failed", error?.message ?? "Please try again.");
    }
  }

  async function onAddExternalProduct(item: ExternalProduct, grams: number) {
    if (grams <= 0) {
      Alert.alert("Invalid amount", "Enter a grams value above zero.");
      return;
    }

    try {
      const saved = await importExternalProduct(item);
      await addProductEntry(saved.id, grams, selectedDate, selectedMealType);
      Alert.alert(
        "Added",
        `${saved.name} was logged for ${formatDateLabel(selectedDate)}.`,
      );
      setActiveProduct(null);
    } catch (error: any) {
      Alert.alert("Add failed", error?.message ?? "Please try again.");
    }
  }

  async function onQuickAddExternalProduct(item: ExternalProduct) {
    await onAddExternalProduct(item, 100);
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

  function removeMealItem(index: number) {
    setMealItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
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

    if (!isValidDateOnly(selectedDate)) {
      Alert.alert("Invalid date", "Use YYYY-MM-DD format.");
      return;
    }

    if (!entryRefId || amount <= 0) {
      Alert.alert("Invalid entry", "Choose item and amount.");
      return;
    }

    try {
      if (entryType === "product") {
        await addProductEntry(
          entryRefId,
          amount,
          selectedDate,
          selectedMealType,
        );
      } else {
        await addMealEntry(entryRefId, amount, selectedDate, selectedMealType);
      }

      setEntryRefId(null);
      setEntryAmount(entryType === "product" ? "100" : "1");
      Alert.alert(
        "Added",
        `Nutrition entry saved for ${formatDateLabel(selectedDate)}.`,
      );
    } catch (error: any) {
      Alert.alert("Save failed", error?.message ?? "Please try again.");
    }
  }

  function confirmDeleteProduct(product: Product) {
    Alert.alert(
      "Delete product?",
      `${product.name} will be removed from your library, meals, and logged entries.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void removeProduct(product.id).then(() => {
              if (activeProduct?.id === product.id) {
                setActiveProduct(null);
              }
            });
          },
        },
      ],
    );
  }

  function confirmDeleteMeal(mealId: string, mealNameLabel: string) {
    Alert.alert(
      "Delete meal?",
      `${mealNameLabel} will be removed from history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void removeMeal(mealId);
          },
        },
      ],
    );
  }

  function confirmDeleteEntry(entryId: string) {
    Alert.alert("Delete entry?", "This log entry will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void removeEntry(entryId);
        },
      },
    ]);
  }

  function openProductDetails(product: ExternalProduct) {
    setActiveProduct(product);
    setActiveProductGrams("100");
  }

  function closeProductDetails() {
    setActiveProduct(null);
    setActiveProductGrams("100");
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient colors={["#0f172a", "#155e75"]} style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Nutrition</Text>
            </View>
            <View style={styles.heroTodayPill}>
              <Text style={styles.heroTodayPillText}>
                Today {Math.round(todaysTotals.calories)} kcal
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{formatDateLabel(selectedDate)}</Text>
          <Text style={styles.heroSubtitle}>
            Track products, meals, and history by day. Pick a date, log intake,
            or open any product for a larger preview.
          </Text>

          <View style={styles.heroStatsRow}>
            <StatPill
              label="Calories"
              value={`${Math.round(selectedDayTotals.calories)} kcal`}
            />
            <StatPill
              label="Protein"
              value={`${selectedDayTotals.protein.toFixed(1)} g`}
            />
            <StatPill
              label="Carbs"
              value={`${selectedDayTotals.carbs.toFixed(1)} g`}
            />
            <StatPill
              label="Fats"
              value={`${selectedDayTotals.fats.toFixed(1)} g`}
            />
          </View>

          <TextInput
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
            style={styles.heroDateInput}
          />

          <View style={styles.chipWrap}>
            {quickDateChips.map((group) => (
              <Pressable
                key={group.date}
                onPress={() => setSelectedDate(group.date)}
                style={[
                  styles.chip,
                  selectedDate === group.date
                    ? styles.chipActive
                    : styles.chipInactive,
                ]}
              >
                <Text
                  style={
                    selectedDate === group.date
                      ? styles.chipActiveText
                      : styles.chipText
                  }
                >
                  {group.date.slice(5)}
                </Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator style={{ marginVertical: 28 }} />
        ) : (
          <>
            <SectionCard
              title="Import products"
              subtitle="Search OpenFoodFacts and preview items before adding them."
            >
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Search food products"
                style={styles.input}
              />
              <Pressable
                onPress={onSearchProducts}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  {searchLoading ? "Searching..." : "Search"}
                </Text>
              </Pressable>

              {searchMessage ? (
                <Text style={styles.subtleMessage}>{searchMessage}</Text>
              ) : null}

              <View style={styles.stackGap}>
                {searchResults.map((result) => (
                  <View key={result.id} style={styles.resultCard}>
                    {result.imageUrl ? (
                      <Image
                        source={{ uri: result.imageUrl }}
                        style={styles.resultImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[styles.resultImage, styles.resultImageFallback]}
                      >
                        <Ionicons
                          name="nutrition-outline"
                          size={22}
                          color="#475569"
                        />
                      </View>
                    )}

                    <View style={styles.resultBody}>
                      <Text style={styles.resultTitle}>{result.name}</Text>
                      <Text style={styles.resultMeta}>
                        {Math.round(result.per100g.calories)} kcal per 100g
                      </Text>
                      <Text style={styles.resultMeta}>
                        P {result.per100g.protein}g · C {result.per100g.carbs}g
                        · F {result.per100g.fats}g
                      </Text>
                    </View>

                    <View style={styles.resultActions}>
                      <Pressable
                        onPress={() => openProductDetails(result)}
                        style={styles.iconButton}
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={20}
                          color="#0f172a"
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => void onQuickAddExternalProduct(result)}
                        style={styles.smallActionButton}
                      >
                        <Text style={styles.smallActionText}>+ Add</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </SectionCard>

            <SectionCard
              title="Add custom product"
              subtitle="Store your own nutrition values per 100g."
            >
              <TextInput
                value={productName}
                onChangeText={setProductName}
                placeholder="Product name"
                style={styles.input}
              />
              <TextInput
                value={productCalories}
                onChangeText={setProductCalories}
                keyboardType="decimal-pad"
                placeholder="Calories"
                style={styles.input}
              />
              <View style={styles.inlineRow}>
                <TextInput
                  value={productProtein}
                  onChangeText={setProductProtein}
                  keyboardType="decimal-pad"
                  placeholder="Protein"
                  style={[styles.input, styles.flexOne]}
                />
                <TextInput
                  value={productCarbs}
                  onChangeText={setProductCarbs}
                  keyboardType="decimal-pad"
                  placeholder="Carbs"
                  style={[styles.input, styles.flexOne]}
                />
                <TextInput
                  value={productFats}
                  onChangeText={setProductFats}
                  keyboardType="decimal-pad"
                  placeholder="Fats"
                  style={[styles.input, styles.flexOne]}
                />
              </View>
              <Pressable
                onPress={onCreateCustomProduct}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Save product</Text>
              </Pressable>
            </SectionCard>

            <SectionCard
              title="Create meal"
              subtitle="Build meals from products, then log them later."
            >
              <TextInput
                value={mealName}
                onChangeText={setMealName}
                placeholder="Meal name"
                style={styles.input}
              />
              <Text style={styles.sectionLabel}>Select product</Text>
              <View style={styles.chipWrap}>
                {products.slice(0, 20).map((product) => (
                  <Pressable
                    key={product.id}
                    onPress={() => setMealProductId(product.id)}
                    style={[
                      styles.chip,
                      mealProductId === product.id
                        ? styles.chipActive
                        : styles.chipInactive,
                    ]}
                  >
                    <Text
                      style={
                        mealProductId === product.id
                          ? styles.chipActiveText
                          : styles.chipText
                      }
                    >
                      {product.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={mealGrams}
                onChangeText={setMealGrams}
                keyboardType="decimal-pad"
                placeholder="Grams in meal"
                style={styles.input}
              />
              <Pressable onPress={onAddMealItem} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Add meal item</Text>
              </Pressable>

              <View style={styles.stackGap}>
                {mealItems.map((item, index) => {
                  const product = productMap.get(item.productId);

                  return (
                    <View
                      key={`${item.productId}_${index}`}
                      style={styles.listRowSoft}
                    >
                      <Text style={styles.listRowText}>
                        {product?.name ?? item.productId} · {item.grams}g
                      </Text>
                      <Pressable
                        onPress={() => removeMealItem(index)}
                        style={styles.iconButtonSoft}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#ef4444"
                        />
                      </Pressable>
                    </View>
                  );
                })}
              </View>

              <Pressable onPress={onCreateMeal} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Save meal</Text>
              </Pressable>
            </SectionCard>

            <SectionCard
              title="Log intake"
              subtitle="Pick a date, choose breakfast or dinner, and add a product or meal."
            >
              <TextInput
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                style={styles.input}
              />

              <View style={styles.chipWrap}>
                {MEAL_TYPE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setSelectedMealType(option.value)}
                    style={[
                      styles.chip,
                      selectedMealType === option.value
                        ? styles.chipActive
                        : styles.chipInactive,
                    ]}
                  >
                    <Text
                      style={
                        selectedMealType === option.value
                          ? styles.chipActiveText
                          : styles.chipText
                      }
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.inlineRow}>
                <Pressable
                  onPress={() => {
                    setEntryType("product");
                    setEntryAmount("100");
                  }}
                  style={[
                    styles.flexOne,
                    entryType === "product"
                      ? styles.primaryButton
                      : styles.secondaryButton,
                  ]}
                >
                  <Text
                    style={
                      entryType === "product"
                        ? styles.primaryButtonText
                        : styles.secondaryButtonText
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
                    styles.flexOne,
                    entryType === "meal"
                      ? styles.primaryButton
                      : styles.secondaryButton,
                  ]}
                >
                  <Text
                    style={
                      entryType === "meal"
                        ? styles.primaryButtonText
                        : styles.secondaryButtonText
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
                      ? (mealMap.get(entryRefId)?.name ?? "")
                      : ""
                }
                placeholder={
                  entryType === "product"
                    ? "Select product below"
                    : "Select meal below"
                }
                style={[styles.input, styles.readOnlyInput]}
              />

              <View style={styles.chipWrap}>
                {(entryType === "product" ? products : meals)
                  .slice(0, 20)
                  .map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setEntryRefId(item.id)}
                      style={[
                        styles.chip,
                        entryRefId === item.id
                          ? styles.chipActive
                          : styles.chipInactive,
                      ]}
                    >
                      <Text
                        style={
                          entryRefId === item.id
                            ? styles.chipActiveText
                            : styles.chipText
                        }
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  ))}
              </View>

              <TextInput
                value={entryAmount}
                onChangeText={setEntryAmount}
                keyboardType="decimal-pad"
                placeholder={entryType === "product" ? "Grams" : "Servings"}
                style={styles.input}
              />
              <Pressable onPress={onAddEntry} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>
                  Add to selected day
                </Text>
              </Pressable>
            </SectionCard>

            <SectionCard
              title="Your library"
              subtitle="Delete any product or meal from here."
            >
              <Text style={styles.sectionLabel}>Products</Text>
              {products.length === 0 ? (
                <Text style={styles.emptyText}>No products yet.</Text>
              ) : (
                <View style={styles.stackGap}>
                  {products.map((product) => (
                    <View key={product.id} style={styles.libraryRow}>
                      {product.imageUrl ? (
                        <Image
                          source={{ uri: product.imageUrl }}
                          style={styles.libraryThumb}
                          contentFit="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.libraryThumb,
                            styles.resultImageFallback,
                          ]}
                        >
                          <Ionicons
                            name="nutrition-outline"
                            size={18}
                            color="#475569"
                          />
                        </View>
                      )}
                      <View style={styles.libraryBody}>
                        <Text style={styles.libraryTitle}>{product.name}</Text>
                        <Text style={styles.libraryMeta}>
                          {Math.round(product.per100g.calories)} kcal ·{" "}
                          {product.per100g.protein}P · {product.per100g.carbs}C
                          · {product.per100g.fats}F
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => confirmDeleteProduct(product)}
                        style={styles.iconButtonSoft}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#ef4444"
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
                Meals
              </Text>
              {meals.length === 0 ? (
                <Text style={styles.emptyText}>No meals yet.</Text>
              ) : (
                <View style={styles.stackGap}>
                  {meals.map((meal) => {
                    const mealMacro = mealMacroMap.get(meal.id) ?? EMPTY_MACRO;

                    return (
                      <View key={meal.id} style={styles.libraryRow}>
                        <View style={styles.libraryBody}>
                          <Text style={styles.libraryTitle}>{meal.name}</Text>
                          <Text style={styles.libraryMeta}>
                            {Math.round(mealMacro.calories)} kcal ·{" "}
                            {mealMacro.protein.toFixed(1)}P ·{" "}
                            {mealMacro.carbs.toFixed(1)}C ·{" "}
                            {mealMacro.fats.toFixed(1)}F
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => confirmDeleteMeal(meal.id, meal.name)}
                          style={styles.iconButtonSoft}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#ef4444"
                          />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </SectionCard>

            <SectionCard
              title="History"
              subtitle="Browse what you ate on previous days and remove anything you logged by mistake."
            >
              {historyGroups.length === 0 ? (
                <Text style={styles.emptyText}>No nutrition history yet.</Text>
              ) : (
                <View style={styles.stackGapLarge}>
                  {historyGroups.map((group) => (
                    <View key={group.date} style={styles.groupCard}>
                      <View style={styles.groupHeader}>
                        <View>
                          <Text style={styles.groupTitle}>
                            {formatDateLabel(group.date)}
                          </Text>
                          <Text style={styles.groupMeta}>
                            {group.items.length} item
                            {group.items.length === 1 ? "" : "s"} ·{" "}
                            {Math.round(group.totals.calories)} kcal
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => setSelectedDate(group.date)}
                          style={styles.smallActionButton}
                        >
                          <Text style={styles.smallActionText}>View</Text>
                        </Pressable>
                      </View>

                      <View style={styles.stackGap}>
                        {group.items.map((item) => (
                          <View key={item.id} style={styles.historyRow}>
                            {item.imageUrl ? (
                              <Image
                                source={{ uri: item.imageUrl }}
                                style={styles.historyThumb}
                                contentFit="cover"
                              />
                            ) : (
                              <View
                                style={[
                                  styles.historyThumb,
                                  styles.resultImageFallback,
                                ]}
                              >
                                <Ionicons
                                  name="nutrition-outline"
                                  size={18}
                                  color="#475569"
                                />
                              </View>
                            )}
                            <View style={styles.historyBody}>
                              <Text style={styles.historyTitle}>
                                {item.title}
                              </Text>
                              <Text style={styles.historyMeta}>
                                {item.sourceLabel} · {item.detail} ·{" "}
                                {item.mealTypeLabel}
                              </Text>
                              <Text style={styles.historyMeta}>
                                {Math.round(item.macros.calories)} kcal ·{" "}
                                {item.macros.protein.toFixed(1)}P ·{" "}
                                {item.macros.carbs.toFixed(1)}C ·{" "}
                                {item.macros.fats.toFixed(1)}F
                              </Text>
                            </View>
                            <Pressable
                              onPress={() => confirmDeleteEntry(item.id)}
                              style={styles.iconButtonSoft}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={18}
                                color="#ef4444"
                              />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>

            <SectionCard
              title="Today snapshot"
              subtitle="Quick view of what was recorded for the current day."
            >
              <Text style={styles.emptyText}>
                {todayEntries.length} logged item
                {todayEntries.length === 1 ? "" : "s"}
              </Text>
              <Text style={styles.libraryMeta}>
                {Math.round(todaysTotals.calories)} kcal ·{" "}
                {todaysTotals.protein.toFixed(1)}P ·{" "}
                {todaysTotals.carbs.toFixed(1)}C ·{" "}
                {todaysTotals.fats.toFixed(1)}F
              </Text>
            </SectionCard>
          </>
        )}
      </ScrollView>

      <Modal
        transparent
        visible={activeProduct !== null}
        animationType="fade"
        onRequestClose={closeProductDetails}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {activeProduct ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{activeProduct.name}</Text>
                  <Pressable
                    onPress={closeProductDetails}
                    style={styles.iconButtonSoft}
                  >
                    <Ionicons name="close-outline" size={22} color="#0f172a" />
                  </Pressable>
                </View>

                <View style={styles.modalVisualWrap}>
                  {activeProduct.imageUrl ? (
                    <Image
                      source={{ uri: activeProduct.imageUrl }}
                      style={styles.modalImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[styles.modalImage, styles.resultImageFallback]}
                    >
                      <Ionicons
                        name="nutrition-outline"
                        size={36}
                        color="#475569"
                      />
                    </View>
                  )}
                </View>

                <Text style={styles.resultMeta}>
                  {Math.round(activeProduct.per100g.calories)} kcal per 100g
                </Text>
                <Text style={styles.resultMeta}>
                  P {activeProduct.per100g.protein}g · C{" "}
                  {activeProduct.per100g.carbs}g · F{" "}
                  {activeProduct.per100g.fats}g
                </Text>

                <TextInput
                  value={activeProductGrams}
                  onChangeText={setActiveProductGrams}
                  keyboardType="decimal-pad"
                  placeholder="Grams"
                  style={styles.input}
                />

                <View style={styles.modalActionsRow}>
                  <Pressable
                    onPress={() => void onSaveExternalProduct(activeProduct)}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>Save</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      void onAddExternalProduct(
                        activeProduct,
                        parsePositiveNumber(activeProductGrams),
                      )
                    }
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>
                      Add to selected day
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = {
  screen: {
    flex: 1,
    backgroundColor: "#eef2ff",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  heroCard: {
    borderRadius: 28,
    padding: 18,
    shadowColor: "#0f172a",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 4,
  },
  heroHeaderRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 14,
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: "#f8fafc",
    fontWeight: "700" as const,
    letterSpacing: 0.4,
  },
  heroTodayPill: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroTodayPillText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800" as const,
  },
  heroSubtitle: {
    color: "#dbeafe",
    marginTop: 8,
    lineHeight: 20,
  },
  heroStatsRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 14,
  },
  heroDateInput: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#ffffff",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: "#0f172a",
  },
  sectionSubtitle: {
    color: "#64748b",
    marginTop: 4,
    lineHeight: 18,
  },
  sectionLabel: {
    color: "#334155",
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  readOnlyInput: {
    backgroundColor: "#f8fafc",
    color: "#0f172a",
  },
  inlineRow: {
    flexDirection: "row" as const,
    gap: 8,
  },
  flexOne: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    textAlign: "center" as const,
    fontWeight: "700" as const,
  },
  secondaryButton: {
    backgroundColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#0f172a",
    textAlign: "center" as const,
    fontWeight: "700" as const,
  },
  chipWrap: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  chipActive: {
    borderColor: "#0f172a",
    backgroundColor: "#0f172a",
  },
  chipInactive: {
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  chipText: {
    fontSize: 12,
    color: "#0f172a",
  },
  chipActiveText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "700" as const,
  },
  resultList: {
    gap: 10,
    marginTop: 8,
  },
  stackGap: {
    gap: 8,
  },
  stackGapLarge: {
    gap: 12,
  },
  resultCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  resultImage: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
  },
  resultImageFallback: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  resultBody: {
    flex: 1,
  },
  resultTitle: {
    color: "#0f172a",
    fontWeight: "800" as const,
    marginBottom: 2,
  },
  resultMeta: {
    color: "#475569",
    marginTop: 2,
    fontSize: 12,
  },
  resultActions: {
    alignItems: "flex-end" as const,
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#e2e8f0",
  },
  iconButtonSoft: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#f1f5f9",
  },
  smallActionButton: {
    backgroundColor: "#0f172a",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallActionText: {
    color: "#ffffff",
    fontWeight: "700" as const,
    fontSize: 12,
  },
  subtleMessage: {
    marginTop: 8,
    color: "#64748b",
  },
  emptyText: {
    color: "#64748b",
  },
  listRowSoft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
  },
  listRowText: {
    color: "#0f172a",
    flex: 1,
    paddingRight: 8,
  },
  libraryRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  libraryThumb: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  libraryBody: {
    flex: 1,
  },
  libraryTitle: {
    color: "#0f172a",
    fontWeight: "700" as const,
  },
  libraryMeta: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  groupCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  groupHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 10,
  },
  groupTitle: {
    color: "#0f172a",
    fontWeight: "800" as const,
    fontSize: 15,
  },
  groupMeta: {
    color: "#64748b",
    marginTop: 3,
    fontSize: 12,
  },
  historyRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  historyThumb: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  historyBody: {
    flex: 1,
  },
  historyTitle: {
    color: "#0f172a",
    fontWeight: "700" as const,
  },
  historyMeta: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.64)",
    justifyContent: "center" as const,
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 10,
    marginBottom: 12,
  },
  modalTitle: {
    flex: 1,
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "800" as const,
  },
  modalVisualWrap: {
    marginBottom: 12,
  },
  modalImage: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    backgroundColor: "#e2e8f0",
  },
  modalActionsRow: {
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 4,
  },
  statPill: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 92,
  },
  statLabel: {
    color: "#cbd5e1",
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800" as const,
    marginTop: 4,
  },
} as const;
