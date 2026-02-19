import { getStepsHistory } from "@/api/steps.api";
import { formatWeekRange, getWeekRange, normalizeWeekData } from "@/utils/week";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";

type ChartMode = "steps" | "calories" | "distance";
const METERS_PER_STEP = 0.7;

export default function Steps() {
  const [mode, setMode] = useState<ChartMode>("steps");
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

  useEffect(() => {
    const loadWeek = async () => {
      const { from: weekFrom, to: weekTo } = getWeekRange(weekOffset);
      setLoading(true);

      try {
        const res = await getStepsHistory(weekFrom, weekTo);
        const normalized = normalizeWeekData(res, weekFrom);
        setData(normalized);
      } catch (e: any) {
        Alert.alert("Loading steps failed.", e?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadWeek();
  }, [weekOffset]);

  return (
    <View style={{ padding: 14 }}>
      <View style={{ alignItems: "center", marginVertical: 16 }}>
        <Text style={{ fontSize: 30, fontWeight: "800", color: "#111" }}>
          {summary.total}
        </Text>

        <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>
          {summary.avg}
        </Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => setWeekOffset((week) => week - 1)}>
          <Text>⬅ Previous</Text>
        </TouchableOpacity>

        <Text>{formatWeekRange(from, to)}</Text>

        <TouchableOpacity onPress={() => setWeekOffset((week) => week + 1)}>
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
            onPress: () => setSelectedIndex(i),
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
    </View>
  );
}
