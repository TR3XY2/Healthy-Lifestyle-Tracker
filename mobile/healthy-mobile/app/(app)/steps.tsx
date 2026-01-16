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

  const { from, to } = getWeekRange(weekOffset);

  const chartData = data.map((d) => ({
    label: d.label,
    value: mode === "steps" ? d.steps : d.calories,
  }));

  const max = Math.max(...chartData.map((d) => d.value));

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
    <View style={{ padding: 16 }}>
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
          data={chartData.map((d) => ({
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
          }))}
          height={260}
          barWidth={30}
          spacing={18}
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
