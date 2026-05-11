import { getProfile, updateHeight } from "@/api/profile.api";
import { getStepsHistory } from "@/api/steps.api";
import { getWeightHistory } from "@/api/weight.api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useNutrition } from "@/hooks/useNutrition";
import { getWeekRange } from "@/utils/week";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Profile() {
  const { logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const { goals, updateGoals, refresh: refreshNutrition } = useNutrition();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [heightInput, setHeightInput] = useState("");
  const [stepsGoalInput, setStepsGoalInput] = useState("8000");
  const [calorieGoalInput, setCalorieGoalInput] = useState("2200");
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [weekStepsTotal, setWeekStepsTotal] = useState(0);

  useEffect(() => {
    setStepsGoalInput(String(goals.stepsGoal));
    setCalorieGoalInput(String(goals.calorieGoal));
  }, [goals.calorieGoal, goals.stepsGoal]);

  const loadProfileData = useCallback(async () => {
    setLoading(true);

    try {
      await refreshNutrition();

      const [profile, weights] = await Promise.all([
        getProfile(),
        getWeightHistory(),
      ]);

      const weekRange = getWeekRange(0);
      const steps = await getStepsHistory(weekRange.from, weekRange.to);

      setHeightCm(profile?.heightCm ?? null);
      setHeightInput(profile?.heightCm ? String(profile.heightCm) : "");

      const latest =
        weights.length > 0 ? weights[weights.length - 1].weight : null;
      setLatestWeight(latest);

      const weekTotal = steps.reduce(
        (sum: number, day: any) => sum + (day.steps ?? 0),
        0,
      );
      setWeekStepsTotal(weekTotal);
    } catch (error: any) {
      Alert.alert(
        t("errors.failedToLoad"),
        error?.message ?? t("errors.tryAgain"),
      );
    } finally {
      setLoading(false);
    }
  }, [refreshNutrition, t]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData]),
  );

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const bmi = useMemo(() => {
    if (!heightCm || !latestWeight) {
      return null;
    }

    const h = heightCm / 100;
    return Number((latestWeight / (h * h)).toFixed(1));
  }, [heightCm, latestWeight]);

  const bmiLabel = useMemo(() => {
    if (!bmi) {
      return t("profile.addHeightAndWeight");
    }

    if (bmi < 18.5) {
      return t("profile.underweight");
    }

    if (bmi < 25) {
      return t("profile.normalWeight");
    }

    if (bmi < 30) {
      return t("profile.overweight");
    }

    return t("profile.obese");
  }, [bmi, t]);

  async function onSaveHeight() {
    const parsed = Number(heightInput.trim());

    if (!Number.isInteger(parsed) || parsed < 50 || parsed > 300) {
      Alert.alert(
        t("errors.invalidInput"),
        t("profile.heightValidationMessage"),
      );
      return;
    }

    setSaving(true);

    try {
      await updateHeight(parsed);
      setHeightCm(parsed);
      Alert.alert(t("common.success"), t("profile.heightSavedMessage"));
    } catch (error: any) {
      Alert.alert(
        t("profile.saveFailed"),
        error?.message ?? t("errors.tryAgain"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function onSaveGoals() {
    const nextStepsGoal = Number(stepsGoalInput.trim());
    const nextCalorieGoal = Number(calorieGoalInput.trim());

    if (
      !Number.isInteger(nextStepsGoal) ||
      nextStepsGoal < 1000 ||
      nextStepsGoal > 50000
    ) {
      Alert.alert(
        t("errors.invalidInput"),
        t("profile.stepsGoalValidationMessage"),
      );
      return;
    }

    if (
      !Number.isInteger(nextCalorieGoal) ||
      nextCalorieGoal < 800 ||
      nextCalorieGoal > 6000
    ) {
      Alert.alert(
        t("errors.invalidInput"),
        t("profile.calorieGoalValidationMessage"),
      );
      return;
    }

    setSavingGoals(true);

    try {
      await updateGoals({
        stepsGoal: nextStepsGoal,
        calorieGoal: nextCalorieGoal,
      });
      Alert.alert(t("common.success"), t("profile.goalsSavedMessage"));
    } catch (error: any) {
      Alert.alert(
        t("profile.saveFailed"),
        error?.message ?? t("errors.tryAgain"),
      );
    } finally {
      setSavingGoals(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 20, paddingBottom: 34 }}
    >
      <View
        style={{
          backgroundColor: "#0f172a",
          padding: 20,
          borderRadius: 20,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "#cbd5e1", fontSize: 14, marginBottom: 6 }}>
          {t("profile.yourProfile")}
        </Text>
        <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>
          {t("profile.healthyLifestyle")}
        </Text>
        <Text style={{ color: "#94a3b8", marginTop: 6 }}>
          {t("profile.trackHabits")}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <>
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              {t("profile.dailyGoals")}
            </Text>
            <Text style={{ color: "#64748b", marginBottom: 10 }}>
              {t("profile.dailyGoalsHint")}
            </Text>

            <TextInput
              keyboardType="number-pad"
              value={stepsGoalInput}
              onChangeText={setStepsGoalInput}
              placeholder={t("profile.stepsGoal")}
              style={{
                borderWidth: 1,
                borderColor: "#cbd5e1",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 11,
                fontSize: 16,
                marginBottom: 8,
              }}
            />

            <TextInput
              keyboardType="number-pad"
              value={calorieGoalInput}
              onChangeText={setCalorieGoalInput}
              placeholder={t("profile.calorieGoal")}
              style={{
                borderWidth: 1,
                borderColor: "#cbd5e1",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 11,
                fontSize: 16,
                marginBottom: 10,
              }}
            />

            <Pressable
              onPress={onSaveGoals}
              disabled={savingGoals}
              style={{
                backgroundColor: savingGoals ? "#94a3b8" : "#0ea5e9",
                borderRadius: 12,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                {savingGoals ? t("profile.saving") : t("profile.saveGoals")}
              </Text>
            </Pressable>
          </View>

          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              {t("profile.height")}
            </Text>
            <Text style={{ color: "#64748b", marginBottom: 10 }}>
              {t("profile.heightHint")}
            </Text>

            <TextInput
              keyboardType="number-pad"
              value={heightInput}
              onChangeText={setHeightInput}
              placeholder={t("profile.heightPlaceholder")}
              style={{
                borderWidth: 1,
                borderColor: "#cbd5e1",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 11,
                fontSize: 16,
                marginBottom: 10,
              }}
            />

            <Pressable
              onPress={onSaveHeight}
              disabled={saving}
              style={{
                backgroundColor: saving ? "#94a3b8" : "#0ea5e9",
                borderRadius: 12,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                {saving ? t("profile.saving") : t("profile.saveHeight")}
              </Text>
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "white",
                borderRadius: 16,
                padding: 14,
                marginRight: 6,
              }}
            >
              <Text style={{ color: "#64748b", marginBottom: 4 }}>BMI</Text>
              <Text style={{ fontSize: 24, fontWeight: "800" }}>
                {bmi ?? "--"}
              </Text>
              <Text style={{ color: "#334155", marginTop: 4 }}>{bmiLabel}</Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "white",
                borderRadius: 16,
                padding: 14,
                marginLeft: 6,
              }}
            >
              <Text style={{ color: "#64748b", marginBottom: 4 }}>
                {t("profile.thisWeek")}
              </Text>
              <Text style={{ fontSize: 24, fontWeight: "800" }}>
                {weekStepsTotal.toLocaleString()}
              </Text>
              <Text style={{ color: "#334155", marginTop: 4 }}>
                {t("profile.stepsTotal")}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              {t("profile.language")}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setLanguage("en")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: language === "en" ? "#0ea5e9" : "#e2e8f0",
                  borderWidth: language === "en" ? 2 : 0,
                  borderColor: "#0284c7",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "600",
                    color: language === "en" ? "white" : "#334155",
                  }}
                >
                  {t("profile.english")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLanguage("uk")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: language === "uk" ? "#0ea5e9" : "#e2e8f0",
                  borderWidth: language === "uk" ? 2 : 0,
                  borderColor: "#0284c7",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "600",
                    color: language === "uk" ? "white" : "#334155",
                  }}
                >
                  {t("profile.ukrainian")}
                </Text>
              </Pressable>
            </View>
          </View>
        </>
      )}

      <Pressable
        onPress={onLogout}
        style={{
          backgroundColor: "#dc2626",
          padding: 14,
          borderRadius: 12,
        }}
      >
        <Text
          style={{ color: "white", textAlign: "center", fontWeight: "700" }}
        >
          {t("common.logout")}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
