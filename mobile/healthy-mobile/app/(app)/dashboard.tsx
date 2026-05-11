import { getProfile } from "@/api/profile.api";
import { getStepsHistory } from "@/api/steps.api";
import { getWeightHistory } from "@/api/weight.api";
import { useNutrition } from "@/hooks/useNutrition";
import { useSync } from "@/hooks/useSync";
import { useI18n } from "@/context/I18nContext";
import { getWeekRange } from "@/utils/week";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const card = {
  marginTop: 12,
  padding: 16,
  borderRadius: 16,
  backgroundColor: "white",
};

const value = {
  fontSize: 28,
  fontWeight: "700" as const,
};

export default function Dashboard() {
  const router = useRouter();
  const { goals, todaysTotals, refresh } = useNutrition();
  const { t } = useI18n();
  useSync();
  const [weights, setWeights] = useState<any[]>([]);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [todaySteps, setTodaySteps] = useState(0);
  const [todayBurned, setTodayBurned] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      await refresh();

      const [profile, weightHistory] = await Promise.all([
        getProfile(),
        getWeightHistory(),
      ]);

      setHeightCm(profile?.heightCm ?? null);
      setWeights(weightHistory);

      const { from, to } = getWeekRange(0);
      const stepsWeek = await getStepsHistory(from, to);
      const today = toDateOnly(new Date());
      const todayData = stepsWeek.find((day) => day.date === today);

      setTodaySteps(todayData?.steps ?? 0);
      setTodayBurned(todayData?.calories ?? 0);
    } catch (err) {
      console.log("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null;

  function calculateBMI(weightKg: number, heightCm: number) {
    const h = heightCm / 100;
    return Number((weightKg / (h * h)).toFixed(1));
  }

  const bmi =
    latestWeight && heightCm
      ? calculateBMI(latestWeight.weight, heightCm)
      : null;

  const stepsLeft = Math.max(goals.stepsGoal - todaySteps, 0);
  const calorieLeft = Math.max(
    Math.round(goals.calorieGoal - todaysTotals.calories + todayBurned),
    0,
  );
  const stepProgress = Math.min(
    Math.round((todaySteps / Math.max(goals.stepsGoal, 1)) * 100),
    100,
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
    >
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <>
          <View
            style={{
              backgroundColor: "#0f172a",
              borderRadius: 18,
              padding: 16,
              marginBottom: 4,
            }}
          >
            <Text style={{ color: "#cbd5e1", marginBottom: 4 }}>
              {t("dashboard.todaySummary")}
            </Text>
            <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>
              {calorieLeft} {t("dashboard.kcalLeft")}
            </Text>
            <Text style={{ color: "#cbd5e1", marginTop: 4 }}>
              {t("dashboard.consumed")} {Math.round(todaysTotals.calories)} ·{" "}
              {t("dashboard.burned")} {todayBurned}
            </Text>
          </View>

          <TouchableOpacity style={card} onPress={() => router.push("/steps")}>
            <Text style={{ fontSize: 18, marginBottom: 8, fontWeight: "700" }}>
              {t("dashboard.stepsProgress")}
            </Text>
            <Text style={value}>
              {todaySteps.toLocaleString()} / {goals.stepsGoal.toLocaleString()}
            </Text>
            <Text style={{ marginTop: 4, color: "#64748b" }}>
              {stepsLeft.toLocaleString()} {t("dashboard.stepsLeft")} ·{" "}
              {stepProgress}% {t("dashboard.complete")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={card}
            onPress={() => router.push("/nutrition")}
          >
            <Text style={{ fontSize: 18, marginBottom: 8, fontWeight: "700" }}>
              {t("dashboard.nutritionToday")}
            </Text>
            <Text style={value}>
              {Math.round(todaysTotals.calories)} {t("dashboard.kcal")}
            </Text>
            <Text style={{ marginTop: 4, color: "#64748b" }}>
              {t("dashboard.protein")} {todaysTotals.protein.toFixed(1)}g ·{" "}
              {t("dashboard.carbs")} {todaysTotals.carbs.toFixed(1)}g ·{" "}
              {t("dashboard.fats")} {todaysTotals.fats.toFixed(1)}g
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={card} onPress={() => router.push("/weight")}>
            <Text style={{ fontSize: 18, marginBottom: 8, fontWeight: "700" }}>
              {t("dashboard.weight")}
            </Text>

            {latestWeight ? (
              <>
                <Text style={value}>{latestWeight.weight.toFixed(2)} kg</Text>
                <Text style={{ marginTop: 4, color: "#64748b" }}>
                  {t("dashboard.latestEntry")}
                </Text>
              </>
            ) : (
              <Text>{t("dashboard.noDataYet")}</Text>
            )}
          </TouchableOpacity>

          {/* BMI Card */}
          <TouchableOpacity style={card} onPress={() => router.push("/bmi")}>
            <Text style={{ fontSize: 18, marginBottom: 8, fontWeight: "700" }}>
              {t("dashboard.bmi")}
            </Text>

            {bmi ? (
              <>
                <Text style={value}>{bmi}</Text>
                <Text style={{ marginTop: 4, color: "#64748b" }}>
                  {t("dashboard.bodyMassIndex")}
                </Text>
              </>
            ) : (
              <Text>{t("profile.addHeightToBmi")}</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
