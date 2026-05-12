import { useNutrition } from "@/hooks/useNutrition";
import { useI18n } from "@/context/I18nContext";
import { getProductByBarcode } from "@/api/nutrition.api";
import {
  ExternalProduct,
  InsightTone,
  MacroValues,
  MealType,
  NutritionEntry,
  Product,
} from "@/types/nutrition";
import { buildSmartInsights } from "@/utils/nutritionInsights";
import { Ionicons } from "@expo/vector-icons";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
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
  mealType?: MealType;
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

type ProductLike = Product | ExternalProduct;

const MEAL_TYPE_OPTIONS_STATIC: { value: MealType; labelKey: string }[] = [
  { value: "breakfast", labelKey: "nutrition.breakfast" },
  { value: "lunch", labelKey: "nutrition.lunch" },
  { value: "dinner", labelKey: "nutrition.dinner" },
  { value: "snack", labelKey: "nutrition.snack" },
  { value: "other", labelKey: "nutrition.other" },
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

function addDays(dateString: string, deltaDays: number) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + deltaDays);
  return toDateOnly(date);
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

function formatMealType(mealType?: MealType, t?: any) {
  if (!mealType || !t) {
    return t ? t("nutrition.other") : "Other";
  }

  const option = MEAL_TYPE_OPTIONS_STATIC.find(
    (option) => option.value === mealType,
  );
  return option ? t(option.labelKey) : t("nutrition.other");
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
  const { t } = useI18n();
  const translate = t as (
    key: string,
    paramsOrDefaultValue?: Record<string, string | number> | string,
  ) => string;
  const {
    loading,
    products,
    meals,
    entries,
    goals,
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

  const today = useMemo(() => toDateOnly(new Date()), []);

  const [selectedDate, setSelectedDate] = useState(today);
  const [searchInput, setSearchInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ExternalProduct[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [isBarcodeLookupLoading, setIsBarcodeLookupLoading] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [activeProduct, setActiveProduct] = useState<ProductLike | null>(null);
  const [activeProductGrams, setActiveProductGrams] = useState("100");
  const [activeProductMealType, setActiveProductMealType] =
    useState<MealType>("other");

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
  const [entryAmount, setEntryAmount] = useState("1");

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
      const mealTypeLabel = formatMealType(entry.mealType, t);

      if (entry.type === "product") {
        const product = entry.productId
          ? productMap.get(entry.productId)
          : null;
        const amount = entry.grams ?? 0;

        return {
          id: entry.id,
          date: entry.date,
          title: product?.name ?? t("nutrition.deletedProduct"),
          detail: `${amount}g`,
          macros: product ? scaleMacro(product.per100g, amount) : EMPTY_MACRO,
          mealType: entry.mealType,
          mealTypeLabel,
          imageUrl: product?.imageUrl,
          sourceLabel: t("nutrition.product"),
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
        title: meal?.name ?? t("nutrition.deletedMeal"),
        detail: `${servings} ${t(servings === 1 ? "nutrition.serving" : "nutrition.servings")}`,
        macros: {
          calories: Number((mealMacro.calories * servings).toFixed(1)),
          protein: Number((mealMacro.protein * servings).toFixed(1)),
          carbs: Number((mealMacro.carbs * servings).toFixed(1)),
          fats: Number((mealMacro.fats * servings).toFixed(1)),
        },
        mealType: entry.mealType,
        mealTypeLabel,
        sourceLabel: t("nutrition.meal"),
        type: entry.type,
      };
    });
  }, [entries, mealMacroMap, mealMap, productMap, t]);

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
      }))
      .slice(0, 5);
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

  const smartInsights = useMemo(
    () =>
      buildSmartInsights({
        selectedDate,
        calorieGoal: goals.calorieGoal,
        entries: entrySummaries.map((entry) => ({
          date: entry.date,
          macros: entry.macros,
          mealType: entry.mealType,
        })),
      }),
    [entrySummaries, goals.calorieGoal, selectedDate],
  );

  const recentProducts = products.slice(0, 5);
  const recentMeals = meals.slice(0, 5);

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
      const nextResults = found.slice(0, 5);
      setSearchResults(nextResults);
      setSearchMessage(
        nextResults.length === 0 ? t("nutrition.nothingFound") : null,
      );
    } catch (error: any) {
      setSearchResults([]);
      setSearchMessage(error?.message ?? t("nutrition.searchFailed"));
    } finally {
      setSearchLoading(false);
    }
  }

  async function onOpenScanner() {
    if (Platform.OS === "web") {
      Alert.alert(
        t("nutrition.scannerUnavailable"),
        t("nutrition.scannerWebOnly"),
      );
      return;
    }

    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert(
          t("nutrition.cameraPermissionNeeded"),
          t("nutrition.allowCameraForScanning"),
        );
        return;
      }
    }

    setHasScanned(false);
    setIsScannerOpen(true);
  }

  function closeScanner() {
    setIsScannerOpen(false);
    setHasScanned(false);
    setIsBarcodeLookupLoading(false);
  }

  async function onBarcodeScanned(event: BarcodeScanningResult) {
    if (hasScanned || isBarcodeLookupLoading) {
      return;
    }

    const code = event.data?.trim();

    if (!code) {
      return;
    }

    setHasScanned(true);
    setIsBarcodeLookupLoading(true);

    try {
      const product = await getProductByBarcode(code);

      if (!product) {
        Alert.alert(
          t("nutrition.notFound"),
          t("nutrition.noProductForBarcode"),
        );
        setHasScanned(false);
        return;
      }

      setSearchInput(product.name);
      setSearchResults([product]);
      setSearchMessage(null);
      closeScanner();
      openProduct(product);
    } catch (error: any) {
      Alert.alert(
        t("nutrition.scanFailed"),
        error?.message ?? t("nutrition.couldNotReadBarcode"),
      );
      setHasScanned(false);
    } finally {
      setIsBarcodeLookupLoading(false);
    }
  }

  function openProduct(product: ProductLike) {
    setActiveProduct(product);
    setActiveProductGrams("100");
    setActiveProductMealType("other");
  }

  function closeProduct() {
    setActiveProduct(null);
    setActiveProductGrams("100");
    setActiveProductMealType("other");
  }

  async function saveActiveProduct() {
    if (!activeProduct) {
      return;
    }

    if ("source" in activeProduct) {
      return;
    }

    try {
      const saved = await importExternalProduct(activeProduct);
      setActiveProduct(saved);
      Alert.alert(
        t("common.success"),
        `${saved.name} ${t("nutrition.wasAddedToLibrary")}.`,
      );
    } catch (error: any) {
      Alert.alert(t("common.error"), error?.message ?? t("common.tryAgain"));
    }
  }

  async function logActiveProduct() {
    if (!activeProduct) {
      return;
    }

    const grams = parsePositiveNumber(activeProductGrams);
    if (grams <= 0) {
      Alert.alert(
        t("nutrition.invalidAmount"),
        t("nutrition.enterGramsAboveZero"),
      );
      return;
    }

    try {
      let productId = activeProduct.id;

      if (!("source" in activeProduct)) {
        const saved = await importExternalProduct(activeProduct);
        productId = saved.id;
        setActiveProduct(saved);
      }

      await addProductEntry(
        productId,
        grams,
        selectedDate,
        activeProductMealType,
      );
      Alert.alert(
        t("common.success"),
        `${t("nutrition.loggedFor")} ${formatDateLabel(selectedDate)}.`,
      );
      closeProduct();
    } catch (error: any) {
      Alert.alert(t("common.error"), error?.message ?? t("common.tryAgain"));
    }
  }

  async function onCreateCustomProduct() {
    const calories = Number(productCalories);
    const protein = Number(productProtein || 0);
    const carbs = Number(productCarbs || 0);
    const fats = Number(productFats || 0);

    if (!productName.trim() || calories <= 0) {
      Alert.alert(
        t("nutrition.invalidProduct"),
        t("nutrition.provideNameAndCalories"),
      );
      return;
    }

    try {
      await addCustomProduct(productName, { calories, protein, carbs, fats });
      setProductName("");
      setProductCalories("");
      setProductProtein("");
      setProductCarbs("");
      setProductFats("");
      Alert.alert(t("common.success"), t("nutrition.customProductAdded"));
    } catch (error: any) {
      Alert.alert(t("common.error"), error?.message ?? t("common.tryAgain"));
    }
  }

  function onAddMealItem() {
    const grams = Number(mealGrams);

    if (!mealProductId || grams <= 0) {
      Alert.alert(
        t("nutrition.invalidItem"),
        t("nutrition.chooseProductAndGrams"),
      );
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
      Alert.alert(
        t("nutrition.invalidMeal"),
        t("nutrition.provideMealNameAndItems"),
      );
      return;
    }

    try {
      await addMeal(mealName, mealItems);
      setMealName("");
      setMealItems([]);
      Alert.alert(t("common.success"), t("nutrition.mealCreatedSuccessfully"));
    } catch (error: any) {
      Alert.alert(t("common.error"), error?.message ?? t("common.tryAgain"));
    }
  }

  async function onAddEntry() {
    const amount = Number(entryAmount);

    if (!isValidDateOnly(selectedDate)) {
      Alert.alert(t("nutrition.invalidDate"), t("nutrition.useYYYYMMDDFormat"));
      return;
    }

    if (!entryRefId || amount <= 0) {
      Alert.alert(
        t("nutrition.invalidEntry"),
        t("nutrition.chooseItemAndAmount"),
      );
      return;
    }

    try {
      if (entryType === "product") {
        await addProductEntry(
          entryRefId,
          amount,
          selectedDate,
          activeProductMealType,
        );
      } else {
        await addMealEntry(
          entryRefId,
          amount,
          selectedDate,
          activeProductMealType,
        );
      }

      setEntryRefId(null);
      setEntryAmount(entryType === "product" ? "100" : "1");
      Alert.alert(
        t("common.success"),
        `${t("nutrition.nutritionEntrySaved")} ${formatDateLabel(selectedDate)}.`,
      );
    } catch (error: any) {
      Alert.alert(t("common.error"), error?.message ?? t("common.tryAgain"));
    }
  }

  function confirmDeleteProduct(product: Product) {
    Alert.alert(
      t("nutrition.deleteProduct"),
      `${product.name} ${t("nutrition.willBeRemovedFromLibrary")}.`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            void removeProduct(product.id).then(() => {
              if (activeProduct?.id === product.id) {
                closeProduct();
              }
            });
          },
        },
      ],
    );
  }

  function confirmDeleteMeal(mealId: string, mealNameLabel: string) {
    Alert.alert(
      t("nutrition.deleteMeal"),
      `${mealNameLabel} ${t("nutrition.willBeRemovedFromHistory")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            void removeMeal(mealId);
          },
        },
      ],
    );
  }

  function confirmDeleteEntry(entryId: string) {
    Alert.alert(t("nutrition.deleteEntry"), t("nutrition.entryWillBeRemoved"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          void removeEntry(entryId);
        },
      },
    ]);
  }

  function shiftSelectedDate(deltaDays: number) {
    setSelectedDate(addDays(selectedDate, deltaDays));
  }

  function goToToday() {
    setSelectedDate(today);
  }

  const visibleProducts = recentProducts;
  const visibleMeals = recentMeals;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient colors={["#0f172a", "#155e75"]} style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {t("nutrition.nutrition")}
              </Text>
            </View>
            <View style={styles.heroTodayPill}>
              <Text style={styles.heroTodayPillText}>
                {t("nutrition.today")} {Math.round(todaysTotals.calories)}{" "}
                {t("dashboard.kcal")}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{formatDateLabel(selectedDate)}</Text>
          <Text style={styles.heroSubtitle}>
            {t("nutrition.navigationInfo")}
          </Text>

          <View style={styles.dateNavRow}>
            <Pressable
              onPress={() => shiftSelectedDate(-1)}
              style={styles.navButton}
            >
              <Ionicons name="chevron-back" size={16} color="#0f172a" />
              <Text style={styles.navButtonText}>
                {t("nutrition.previous")}
              </Text>
            </Pressable>
            <Pressable onPress={goToToday} style={styles.navButtonPrimary}>
              <Text style={styles.navButtonPrimaryText}>
                {t("nutrition.today")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => shiftSelectedDate(1)}
              style={styles.navButton}
            >
              <Text style={styles.navButtonText}>{t("nutrition.next")}</Text>
              <Ionicons name="chevron-forward" size={16} color="#0f172a" />
            </Pressable>
          </View>

          <View style={styles.heroStatsRow}>
            <StatPill
              label={t("nutrition.calories")}
              value={`${Math.round(selectedDayTotals.calories)} kcal`}
            />
            <StatPill
              label={t("nutrition.protein")}
              value={`${selectedDayTotals.protein.toFixed(1)} g`}
            />
            <StatPill
              label={t("nutrition.carbs")}
              value={`${selectedDayTotals.carbs.toFixed(1)} g`}
            />
            <StatPill
              label={t("nutrition.fats")}
              value={`${selectedDayTotals.fats.toFixed(1)} g`}
            />
          </View>

          <Text style={styles.heroMeta}>
            {selectedDayEntries.length}{" "}
            {t(
              selectedDayEntries.length === 1
                ? "nutrition.item"
                : "nutrition.items",
            )}{" "}
            {t("nutrition.loggedForDay")}
          </Text>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator style={{ marginVertical: 28 }} />
        ) : (
          <>
            <SectionCard
              title={t("nutrition.products")}
              subtitle={t("nutrition.searchInfo")}
            >
              <View style={styles.insightsWrap}>
                {smartInsights.map((insight) => (
                  <View
                    key={insight.id}
                    style={[
                      styles.insightCard,
                      insight.tone === "positive"
                        ? styles.insightCardPositive
                        : insight.tone === "warning"
                          ? styles.insightCardWarning
                          : styles.insightCardInfo,
                    ]}
                  >
                    <View style={styles.insightHeader}>
                      <View
                        style={[
                          styles.insightBadge,
                          insight.tone === "positive"
                            ? styles.insightBadgePositive
                            : insight.tone === "warning"
                              ? styles.insightBadgeWarning
                              : styles.insightBadgeInfo,
                        ]}
                      >
                        <Ionicons
                          name={getInsightIcon(insight.tone)}
                          size={14}
                          color={getInsightIconColor(insight.tone)}
                        />
                      </View>
                      <Text style={styles.insightTitle}>
                        {insight.titleKey
                          ? translate(insight.titleKey, insight.params ?? {})
                          : insight.title}
                      </Text>
                    </View>
                    <Text style={styles.insightMessage}>
                      {insight.messageKey
                        ? translate(insight.messageKey, insight.params ?? {})
                        : insight.message}
                    </Text>
                    {insight.actionKey || insight.action ? (
                      <Text style={styles.insightAction}>
                        {insight.actionKey
                          ? translate(insight.actionKey, insight.params ?? {})
                          : insight.action}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>

              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder={t("nutrition.searchFoodProducts")}
                style={styles.input}
              />
              <Pressable onPress={onOpenScanner} style={styles.scanButton}>
                <Ionicons name="barcode-outline" size={16} color="#0f172a" />
                <Text style={styles.scanButtonText}>
                  {t("nutrition.scanBarcode")}
                </Text>
              </Pressable>
              <Pressable
                onPress={onSearchProducts}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  {searchLoading
                    ? t("nutrition.searching")
                    : t("nutrition.search")}
                </Text>
              </Pressable>

              {searchMessage ? (
                <Text style={styles.subtleMessage}>{searchMessage}</Text>
              ) : null}

              <View style={styles.stackGap}>
                {searchResults.map((result) => (
                  <Pressable
                    key={result.id}
                    onPress={() => openProduct(result)}
                    style={styles.resultCard}
                  >
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
                        {Math.round(result.per100g.calories)}{" "}
                        {t("dashboard.kcal")} / 100 {t("nutrition.grams")}
                      </Text>
                      <Text style={styles.resultMeta}>
                        {t("nutrition.tapToOpenPicker")}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#64748b"
                    />
                  </Pressable>
                ))}
              </View>

              <Text style={styles.sectionLabel}>
                {t("nutrition.recentLibrary")}
              </Text>
              {visibleProducts.length === 0 ? (
                <Text style={styles.emptyText}>
                  {t("nutrition.noProducts")}
                </Text>
              ) : (
                <View style={styles.stackGap}>
                  {visibleProducts.map((product) => (
                    <View key={product.id} style={styles.libraryRow}>
                      <Pressable
                        style={styles.libraryMain}
                        onPress={() => openProduct(product)}
                      >
                        <Text style={styles.libraryTitle}>{product.name}</Text>
                        <Text style={styles.libraryMeta}>
                          {Math.round(product.per100g.calories)}{" "}
                          {t("dashboard.kcal")} · {product.per100g.protein}P ·{" "}
                          {product.per100g.carbs}C · {product.per100g.fats}F
                        </Text>
                      </Pressable>
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
                {t("nutrition.customProduct")}
              </Text>
              <TextInput
                value={productName}
                onChangeText={setProductName}
                placeholder={t("nutrition.productName")}
                style={styles.input}
              />
              <View style={styles.inlineRow}>
                <TextInput
                  value={productCalories}
                  onChangeText={setProductCalories}
                  keyboardType="decimal-pad"
                  placeholder={t("nutrition.calories")}
                  style={[styles.input, styles.flexOne]}
                />
                <TextInput
                  value={productProtein}
                  onChangeText={setProductProtein}
                  keyboardType="decimal-pad"
                  placeholder={t("nutrition.protein")}
                  style={[styles.input, styles.flexOne]}
                />
              </View>
              <View style={styles.inlineRow}>
                <TextInput
                  value={productCarbs}
                  onChangeText={setProductCarbs}
                  keyboardType="decimal-pad"
                  placeholder={t("nutrition.carbs")}
                  style={[styles.input, styles.flexOne]}
                />
                <TextInput
                  value={productFats}
                  onChangeText={setProductFats}
                  keyboardType="decimal-pad"
                  placeholder={t("nutrition.fats")}
                  style={[styles.input, styles.flexOne]}
                />
              </View>
              <Pressable
                onPress={onCreateCustomProduct}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>
                  {t("nutrition.saveCustomProduct")}
                </Text>
              </Pressable>
            </SectionCard>

            <SectionCard
              title={t("nutrition.meals")}
              subtitle={t("nutrition.recentProductsInfo")}
            >
              <TextInput
                value={mealName}
                onChangeText={setMealName}
                placeholder={t("nutrition.mealName")}
                style={styles.input}
              />
              <Text style={styles.sectionLabel}>
                {t("nutrition.recentProducts")}
              </Text>
              <View style={styles.chipWrap}>
                {visibleProducts.map((product) => (
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
                placeholder={t("weight.grams")}
                style={styles.input}
              />
              <Pressable onPress={onAddMealItem} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>
                  {t("nutrition.addMealItem")}
                </Text>
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
                <Text style={styles.primaryButtonText}>
                  {t("nutrition.saveMeal")}
                </Text>
              </Pressable>

              <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
                {t("nutrition.recentMeals")}
              </Text>
              {visibleMeals.length === 0 ? (
                <Text style={styles.emptyText}>{t("nutrition.noMeals")}</Text>
              ) : (
                <View style={styles.stackGap}>
                  {visibleMeals.map((meal) => (
                    <View key={meal.id} style={styles.libraryRow}>
                      <Pressable
                        style={styles.libraryMain}
                        onPress={() => setEntryRefId(meal.id)}
                      >
                        <Text style={styles.libraryTitle}>{meal.name}</Text>
                        <Text style={styles.libraryMeta}>
                          {meal.items.length}{" "}
                          {t(
                            meal.items.length === 1
                              ? "nutrition.item"
                              : "nutrition.items",
                          )}
                        </Text>
                      </Pressable>
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
                  ))}
                </View>
              )}

              <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
                {t("nutrition.logIntake")}
              </Text>
              <View style={styles.inlineRow}>
                <Pressable
                  onPress={() => setEntryType("product")}
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
                    {t("nutrition.product")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setEntryType("meal")}
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
                    {t("nutrition.meal")}
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
                    ? t("nutrition.tapRecentProduct")
                    : t("nutrition.tapRecentMeal")
                }
                style={[styles.input, styles.readOnlyInput]}
              />

              <View style={styles.chipWrap}>
                {(entryType === "product" ? visibleProducts : visibleMeals).map(
                  (item) => (
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
                  ),
                )}
              </View>

              <TextInput
                value={entryAmount}
                onChangeText={setEntryAmount}
                keyboardType="decimal-pad"
                placeholder={
                  entryType === "product"
                    ? t("nutrition.grams")
                    : t("nutrition.servings")
                }
                style={styles.input}
              />
              <Pressable onPress={onAddEntry} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>
                  {t("nutrition.addToSelectedDay")}
                </Text>
              </Pressable>
            </SectionCard>

            <SectionCard
              title={t("nutrition.history")}
              subtitle={t("nutrition.recentViewInfo")}
            >
              {historyGroups.length === 0 ? (
                <Text style={styles.emptyText}>{t("nutrition.noHistory")}</Text>
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
                            {group.items.length}{" "}
                            {t(
                              group.items.length === 1
                                ? "nutrition.item"
                                : "nutrition.items",
                            )}{" "}
                            · {Math.round(group.totals.calories)}{" "}
                            {t("dashboard.kcal")}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => setSelectedDate(group.date)}
                          style={styles.smallActionButton}
                        >
                          <Text style={styles.smallActionText}>
                            {t("nutrition.view")}
                          </Text>
                        </Pressable>
                      </View>

                      <View style={styles.stackGap}>
                        {group.items.slice(0, 3).map((item) => (
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
                                {Math.round(item.macros.calories)}{" "}
                                {t("dashboard.kcal")} ·{" "}
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
          </>
        )}
      </ScrollView>

      <Modal
        transparent
        visible={activeProduct !== null}
        animationType="fade"
        onRequestClose={closeProduct}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {activeProduct ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{activeProduct.name}</Text>
                  <Pressable
                    onPress={closeProduct}
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
                  {Math.round(activeProduct.per100g.calories)}{" "}
                  {t("dashboard.kcal")} / 100 {t("nutrition.grams")}
                </Text>
                <Text style={styles.resultMeta}>
                  P {activeProduct.per100g.protein}g · C{" "}
                  {activeProduct.per100g.carbs}g · F{" "}
                  {activeProduct.per100g.fats}g
                </Text>

                <View style={styles.chipWrap}>
                  {MEAL_TYPE_OPTIONS_STATIC.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => setActiveProductMealType(option.value)}
                      style={[
                        styles.chip,
                        activeProductMealType === option.value
                          ? styles.chipActive
                          : styles.chipInactive,
                      ]}
                    >
                      <Text
                        style={
                          activeProductMealType === option.value
                            ? styles.chipActiveText
                            : styles.chipText
                        }
                      >
                        {t(option.labelKey)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  value={activeProductGrams}
                  onChangeText={setActiveProductGrams}
                  keyboardType="decimal-pad"
                  placeholder={t("nutrition.grams")}
                  style={styles.input}
                />

                <View style={styles.modalActionsRow}>
                  {!("source" in activeProduct) ? (
                    <Pressable
                      onPress={() => void saveActiveProduct()}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {t("common.save")}
                      </Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => void logActiveProduct()}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>
                      {t("nutrition.logSelected")}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={isScannerOpen}
        animationType="fade"
        onRequestClose={closeScanner}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.scannerCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("nutrition.scanBarcode")}
              </Text>
              <Pressable onPress={closeScanner} style={styles.iconButtonSoft}>
                <Ionicons name="close-outline" size={22} color="#0f172a" />
              </Pressable>
            </View>

            <Text style={styles.scannerHint}>
              {t("nutrition.placeMealInfo")}
            </Text>

            <View style={styles.scannerViewWrap}>
              <CameraView
                style={styles.scannerView}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: [
                    "ean13",
                    "ean8",
                    "upc_a",
                    "upc_e",
                    "code128",
                    "code39",
                    "qr",
                  ],
                }}
                onBarcodeScanned={onBarcodeScanned}
              />
            </View>

            {isBarcodeLookupLoading ? (
              <View style={styles.scannerStatusRow}>
                <ActivityIndicator size="small" />
                <Text style={styles.scannerStatusText}>
                  {t("nutrition.lookingUpProduct")}
                </Text>
              </View>
            ) : null}

            {hasScanned && !isBarcodeLookupLoading ? (
              <Pressable
                onPress={() => {
                  setHasScanned(false);
                }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>
                  {t("nutrition.scanAgain")}
                </Text>
              </Pressable>
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
  children: any;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

function getInsightIcon(
  tone: InsightTone,
): "sparkles" | "warning" | "information-circle" {
  if (tone === "positive") {
    return "sparkles";
  }

  if (tone === "warning") {
    return "warning";
  }

  return "information-circle";
}

function getInsightIconColor(tone: InsightTone) {
  if (tone === "positive") {
    return "#166534";
  }

  if (tone === "warning") {
    return "#9a3412";
  }

  return "#1d4ed8";
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
  screen: { flex: 1, backgroundColor: "#eef2ff" },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
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
  heroTitle: { color: "#ffffff", fontSize: 28, fontWeight: "800" as const },
  heroSubtitle: { color: "#dbeafe", marginTop: 8, lineHeight: 20 },
  dateNavRow: { flexDirection: "row" as const, gap: 8, marginTop: 14 },
  navButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    paddingVertical: 10,
  },
  navButtonText: { color: "#0f172a", fontWeight: "700" as const },
  navButtonPrimary: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    paddingVertical: 10,
  },
  navButtonPrimaryText: { color: "#ffffff", fontWeight: "700" as const },
  heroStatsRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 14,
  },
  heroMeta: { color: "#dbeafe", marginTop: 12, fontSize: 12 },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800" as const, color: "#0f172a" },
  sectionSubtitle: { color: "#64748b", marginTop: 4, lineHeight: 18 },
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
  readOnlyInput: { backgroundColor: "#f8fafc", color: "#0f172a" },
  inlineRow: { flexDirection: "row" as const, gap: 8 },
  flexOne: { flex: 1 },
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
  chipActive: { borderColor: "#0f172a", backgroundColor: "#0f172a" },
  chipInactive: { borderColor: "#cbd5e1", backgroundColor: "#f8fafc" },
  chipText: { fontSize: 12, color: "#0f172a" },
  chipActiveText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "700" as const,
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
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
  },
  resultImageFallback: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  resultBody: { flex: 1 },
  resultTitle: {
    color: "#0f172a",
    fontWeight: "800" as const,
    marginBottom: 2,
  },
  resultMeta: { color: "#475569", marginTop: 2, fontSize: 12 },
  stackGap: { gap: 8 },
  stackGapLarge: { gap: 12 },
  emptyText: { color: "#64748b" },
  subtleMessage: { marginTop: 8, color: "#64748b" },
  scanButton: {
    marginTop: -2,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
  },
  scanButtonText: {
    color: "#0f172a",
    fontWeight: "700" as const,
    fontSize: 13,
  },
  insightsWrap: {
    gap: 8,
    marginBottom: 10,
  },
  insightCard: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  insightCardPositive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
  },
  insightCardWarning: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
  },
  insightCardInfo: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  insightHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  insightBadge: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  insightBadgePositive: {
    backgroundColor: "#dcfce7",
  },
  insightBadgeWarning: {
    backgroundColor: "#ffedd5",
  },
  insightBadgeInfo: {
    backgroundColor: "#dbeafe",
  },
  insightTitle: {
    flex: 1,
    color: "#0f172a",
    fontWeight: "700" as const,
    fontSize: 13,
  },
  insightMessage: {
    color: "#334155",
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },
  insightAction: {
    color: "#0f172a",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700" as const,
  },
  libraryRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  libraryMain: { flex: 1 },
  libraryTitle: { color: "#0f172a", fontWeight: "700" as const },
  libraryMeta: { color: "#64748b", fontSize: 12, marginTop: 2 },
  iconButtonSoft: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#f1f5f9",
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
  listRowText: { color: "#0f172a", flex: 1, paddingRight: 8 },
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
  groupTitle: { color: "#0f172a", fontWeight: "800" as const, fontSize: 15 },
  groupMeta: { color: "#64748b", marginTop: 3, fontSize: 12 },
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
  historyBody: { flex: 1 },
  historyTitle: { color: "#0f172a", fontWeight: "700" as const },
  historyMeta: { color: "#64748b", fontSize: 12, marginTop: 2 },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.64)",
    justifyContent: "center" as const,
    padding: 16,
  },
  modalCard: { backgroundColor: "#ffffff", borderRadius: 24, padding: 16 },
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
  modalVisualWrap: { marginBottom: 12 },
  modalImage: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    backgroundColor: "#e2e8f0",
  },
  modalActionsRow: { flexDirection: "row" as const, gap: 10, marginTop: 4 },
  scannerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 16,
  },
  scannerHint: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  scannerViewWrap: {
    borderRadius: 18,
    overflow: "hidden" as const,
    height: 300,
    backgroundColor: "#0f172a",
  },
  scannerView: {
    flex: 1,
  },
  scannerStatusRow: {
    marginTop: 10,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  scannerStatusText: {
    color: "#334155",
    fontSize: 12,
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
