import { getProfile, updateHeight } from "@/api/profile.api";
import { getStepsHistory } from "@/api/steps.api";
import { getWeightHistory } from "@/api/weight.api";
import { useAuth } from "@/context/AuthContext";
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
        "Failed to load profile",
        error?.message ?? "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [refreshNutrition]);

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
      return "Add height and weight to calculate";
    }

    if (bmi < 18.5) {
      return "Underweight";
    }

    if (bmi < 25) {
      return "Healthy";
    }

    if (bmi < 30) {
      return "Overweight";
    }

    return "Obesity";
  }, [bmi]);

  async function onSaveHeight() {
    const parsed = Number(heightInput.trim());

    if (!Number.isInteger(parsed) || parsed < 50 || parsed > 300) {
      Alert.alert(
        "Invalid height",
        "Please enter a value between 50 and 300 cm.",
      );
      return;
    }

    setSaving(true);

    try {
      await updateHeight(parsed);
      setHeightCm(parsed);
      Alert.alert("Saved", "Your height has been updated.");
    } catch (error: any) {
      Alert.alert("Save failed", error?.message ?? "Please try again.");
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
      Alert.alert("Invalid steps goal", "Use a value from 1000 to 50000.");
      return;
    }

    if (
      !Number.isInteger(nextCalorieGoal) ||
      nextCalorieGoal < 800 ||
      nextCalorieGoal > 6000
    ) {
      Alert.alert("Invalid calorie goal", "Use a value from 800 to 6000.");
      return;
    }

    setSavingGoals(true);

    try {
      await updateGoals({
        stepsGoal: nextStepsGoal,
        calorieGoal: nextCalorieGoal,
      });
      Alert.alert("Saved", "Daily goals updated.");
    } catch (error: any) {
      Alert.alert("Save failed", error?.message ?? "Please try again.");
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
          Your Profile
        </Text>
        <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>
          Healthy Lifestyle
        </Text>
        <Text style={{ color: "#94a3b8", marginTop: 6 }}>
          Track better habits with consistent data.
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
              Daily goals
            </Text>
            <Text style={{ color: "#64748b", marginBottom: 10 }}>
              Default steps goal is 8000. Update your targets anytime.
            </Text>

            <TextInput
              keyboardType="number-pad"
              value={stepsGoalInput}
              onChangeText={setStepsGoalInput}
              placeholder="Steps goal"
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
              placeholder="Calorie goal"
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
                {savingGoals ? "Saving..." : "Save Goals"}
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
              Height
            </Text>
            <Text style={{ color: "#64748b", marginBottom: 10 }}>
              Used for BMI calculations and trend insights.
            </Text>

            <TextInput
              keyboardType="number-pad"
              value={heightInput}
              onChangeText={setHeightInput}
              placeholder="Enter height in cm"
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
                {saving ? "Saving..." : "Save Height"}
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
                This week
              </Text>
              <Text style={{ fontSize: 24, fontWeight: "800" }}>
                {weekStepsTotal.toLocaleString()}
              </Text>
              <Text style={{ color: "#334155", marginTop: 4 }}>
                steps total
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
              Latest weight
            </Text>
            <Text style={{ fontSize: 26, fontWeight: "800" }}>
              {latestWeight ? `${latestWeight.toFixed(2)} kg` : "No data yet"}
            </Text>
            <Text style={{ color: "#64748b", marginTop: 6 }}>
              Keep logging to improve your trend accuracy.
            </Text>
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
          Logout
        </Text>
      </Pressable>
    </ScrollView>
  );
}
