import { deleteSteps, getStepsHistory, saveSteps } from "@/api/steps.api";
import { formatWeekRange, getWeekRange, normalizeWeekData } from "@/utils/week";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";

type ChartMode = "steps" | "calories" | "distance";
const METERS_PER_STEP = 0.7;

export default function Steps() {
  const [mode, setMode] = useState<ChartMode>("steps");
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [stepInput, setStepInput] = useState("");

  const { from, to } = getWeekRange(weekOffset);

  const stepsToKm = (steps: number) =>
    Number(((steps * METERS_PER_STEP) / 1000).toFixed(2));

  const chartData = data.map((d) => {
    if (mode === "distance") {
      return {
        label: d.label,
        value: stepsToKm(d.steps),
      };
    }

    return {
      label: d.label,
      value: mode === "steps" ? d.steps : d.calories,
    };
  });

  const max = Math.max(...chartData.map((d) => d.value));
  const totalSteps = data.reduce((a, b) => a + b.steps, 0);
  const avgSteps = Math.round(totalSteps / 7);
  const totalCalories = data.reduce((a, b) => a + b.calories, 0);
  const avgCalories = Math.round(totalCalories / 7);
  const totalDistance = Number(
    data.reduce((sum, day) => sum + stepsToKm(day.steps), 0).toFixed(2),
  );
  const avgDistance = Number((totalDistance / 7).toFixed(2));

  const summary =
    mode === "steps"
      ? {
          total: `${totalSteps.toLocaleString()} steps`,
          avg: `${avgSteps.toLocaleString()} avg / day`,
        }
      : mode === "calories"
        ? {
            total: `${totalCalories.toLocaleString()} kcal`,
            avg: `${avgCalories.toLocaleString()} avg / day`,
          }
        : {
            total: `${totalDistance.toFixed(2)} km`,
            avg: `${avgDistance.toFixed(2)} avg km / day`,
          };

  const formatValue = (value: number) => {
    if (mode === "steps") {
      return value >= 10000 ? `${Math.round(value / 1000)}k` : value.toString();
    }

    if (mode === "distance") {
      return `${value} km`;
    }

    return `${value} kcal`;
  };

  const selectedDay =
    selectedIndex !== null && data[selectedIndex] ? data[selectedIndex] : null;

  const selectedDateLabel = useMemo(() => {
    if (!selectedDay) {
      return "";
    }

    const [year, month, day] = selectedDay.date.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);

    return localDate.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }, [selectedDay]);

  const loadWeek = useCallback(
    async (
      offset: number,
      keepSelected: boolean,
      currentSelectedIndex: number | null,
    ) => {
      const { from: weekFrom, to: weekTo } = getWeekRange(offset);
      setLoading(true);

      try {
        const res = await getStepsHistory(weekFrom, weekTo);
        const normalized = normalizeWeekData(res, weekFrom);
        setData(normalized);

        if (!keepSelected) {
          setSelectedIndex(null);
          setStepInput("");
        } else if (currentSelectedIndex !== null) {
          const safeIndex = Math.min(
            currentSelectedIndex,
            normalized.length - 1,
          );
          setSelectedIndex(safeIndex);
          setStepInput(String(normalized[safeIndex]?.steps ?? 0));
        }
      } catch (e: any) {
        Alert.alert("Loading steps failed.", e?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const onSelectBar = (index: number) => {
    setSelectedIndex(index);
    setStepInput(String(data[index]?.steps ?? 0));
  };

  const onSaveSelected = async () => {
    if (!selectedDay) {
      return;
    }

    const parsed = Number(stepInput.trim());

    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 200000) {
      Alert.alert(
        "Invalid steps",
        "Enter a whole number between 0 and 200000.",
      );
      return;
    }

    setSaving(true);

    try {
      await saveSteps({
        date: selectedDay.date,
        steps: parsed,
      });

      await loadWeek(weekOffset, true, selectedIndex);
      Alert.alert("Saved", "Steps updated for selected day.");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteSelected = () => {
    if (!selectedDay || !selectedDay.hasRecord) {
      Alert.alert("Nothing to delete", "No steps record exists for this day.");
      return;
    }

    Alert.alert("Delete entry", `Delete steps for ${selectedDateLabel}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setSaving(true);

          try {
            await deleteSteps(selectedDay.date);
            await loadWeek(weekOffset, true, selectedIndex);
            Alert.alert("Deleted", "Steps entry removed.");
          } catch (e: any) {
            if (e?.status === 404) {
              await loadWeek(weekOffset, true, selectedIndex);
              Alert.alert("Deleted", "Steps entry was already removed.");
              return;
            }

            Alert.alert("Delete failed", e?.message ?? "Unknown error");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    loadWeek(weekOffset, false, null);
  }, [loadWeek, weekOffset]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginVertical: 16 }}>
          <Text style={{ fontSize: 30, fontWeight: "800", color: "#111" }}>
            {summary.total}
          </Text>

          <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>
            {summary.avg}
          </Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={() => setWeekOffset((week) => week - 1)}
            style={{
              backgroundColor: "#e2e8f0",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text>⬅ Previous</Text>
          </TouchableOpacity>

          <Text style={{ fontWeight: "600" }}>{formatWeekRange(from, to)}</Text>

          <TouchableOpacity
            onPress={() => setWeekOffset((week) => week + 1)}
            style={{
              backgroundColor: "#e2e8f0",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text>Next ➡</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : (
          <BarChart
            data={chartData.map((d, i) => ({
              ...d,
              topLabelComponent: () => (
                <Text
                  style={{
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  {formatValue(d.value)}
                </Text>
              ),
              frontColor: i === selectedIndex ? "green" : "black",
              onPress: () => onSelectBar(i),
            }))}
            height={260}
            barWidth={30}
            spacing={14}
            maxValue={max * 1.15}
            hideRules
            yAxisThickness={0}
            xAxisThickness={0}
            yAxisTextStyle={{ color: "#888" }}
            xAxisLabelTextStyle={{ color: "#444" }}
          />
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginVertical: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => setMode("steps")}
            style={{
              padding: 8,
              marginRight: 8,
              backgroundColor: mode === "steps" ? "#4caf50" : "#ddd",
              borderRadius: 6,
            }}
          >
            <Text>Steps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode("calories")}
            style={{
              padding: 8,
              backgroundColor: mode === "calories" ? "#ff9800" : "#ddd",
              borderRadius: 6,
            }}
          >
            <Text>Calories</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode("distance")}
            style={{
              padding: 8,
              marginLeft: 8,
              backgroundColor: mode === "distance" ? "#2196f3" : "#ddd",
              borderRadius: 6,
            }}
          >
            <Text>Distance</Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            marginTop: 8,
            backgroundColor: "white",
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: "#e2e8f0",
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "700", marginBottom: 4 }}>
            {selectedDay ? `Selected: ${selectedDateLabel}` : "Select a day"}
          </Text>

          <Text style={{ color: "#64748b", marginBottom: 10 }}>
            Tap a bar to set, change, or delete steps for that day.
          </Text>

          <TextInput
            value={stepInput}
            onChangeText={setStepInput}
            keyboardType="number-pad"
            returnKeyType="done"
            editable={!!selectedDay && !saving}
            placeholder="Steps for selected day"
            style={{
              borderWidth: 1,
              borderColor: "#cbd5e1",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginBottom: 10,
              backgroundColor: selectedDay ? "white" : "#f1f5f9",
            }}
          />

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <TouchableOpacity
              disabled={!selectedDay || saving}
              onPress={onSaveSelected}
              style={{
                flex: 1,
                backgroundColor: !selectedDay || saving ? "#94a3b8" : "#0ea5e9",
                borderRadius: 10,
                paddingVertical: 11,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontWeight: "700",
                }}
              >
                {saving ? "Working..." : "Save"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!selectedDay || saving}
              onPress={onDeleteSelected}
              style={{
                flex: 1,
                backgroundColor: !selectedDay || saving ? "#94a3b8" : "#ef4444",
                borderRadius: 10,
                paddingVertical: 11,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontWeight: "700",
                }}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
