import { getStepsHistory } from "@/api/steps.api";
import { getWeekRange, normalizeWeekData } from "@/utils/week";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";

export default function Steps() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeek();
  }, [weekOffset]);

  async function loadWeek() {
    setLoading(true);
    const { from, to } = getWeekRange(weekOffset);

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

        <Text>Week {weekOffset === 0 ? "Current" : weekOffset}</Text>

        <TouchableOpacity onPress={() => setWeekOffset((week) => week + 1)}>
          <Text>Next ➡</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <BarChart
          data={data}
          height={220}
          barWidth={24}
          spacing={22}
          roundedTop
          hideRules
          yAxisThickness={0}
          xAxisThickness={0}
          yAxisTextStyle={{ color: "#888" }}
          xAxisLabelTextStyle={{ color: "#444" }}
        />
      )}
    </View>
  );
}
