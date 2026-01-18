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

type ChartMode = "steps" | "calories";

export default function Steps() {
  const [mode, setMode] = useState<ChartMode>("steps");
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { from, to } = getWeekRange(weekOffset);

  const chartData = data.map((d) => ({
    label: d.label,
    value: mode === "steps" ? d.steps : d.calories,
  }));

  const max = Math.max(...chartData.map((d) => d.value));
  const totalSteps = data.reduce((a, b) => a + b.steps, 0);
  const avgSteps = Math.round(totalSteps / 7);

  const formatValue = (value: number) => {
    if (mode === "steps") {
      if (value >= 10000) return `${Math.round(value / 1000)}k`;
      return value.toString();
    }

    return `${value} kcal`;
  };

  useEffect(() => {
    loadWeek();
  }, [weekOffset]);

  async function loadWeek() {
    setLoading(true);

    try {
      const res = await getStepsHistory(from, to);
      const normalized = normalizeWeekData(res, from);
      setData(normalized);
    } catch (e: any) {
      Alert.alert("Loading steps failed.", e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ padding: 14}}>
      <View style={{ alignItems: "center", marginVertical: 16}}>
        <Text style={{ fontSize: 30, fontWeight: "800", color: "#111" }}>
          {totalSteps.toLocaleString()} steps
        </Text>

        <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>
          {avgSteps.toLocaleString()} avg / day
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
      </View>
    </View>
  );
}
