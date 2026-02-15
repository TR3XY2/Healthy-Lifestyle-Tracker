import React, { useState } from "react";
import { View, Text, Dimensions, TouchableOpacity } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";

const screenWidth = Dimensions.get("window").width;
const visiblePoints = 7;
const spacing = screenWidth / visiblePoints;

export default function Weight() {
  const router = useRouter();

  const weights = [
    { value: 88, label: "1" },
    { value: 88.5, label: "2" },
    { value: 89, label: "3" },
    { value: 88.8, label: "4" },
    { value: 88.4, label: "5" },
    { value: 88, label: "6" },
    { value: 87.7, label: "7" },
    { value: 87.3, label: "8" },
    { value: 87, label: "9" },
  ];

  const [selectedIndex, setSelectedIndex] = useState(weights.length - 1);

  const centerIndex = Math.floor(visiblePoints / 2);

  const dataMin = Math.min(...weights.map((w) => w.value));
  const padding = 1;

  const base = dataMin - padding;

  const normalizedData = weights.map((w) => w.value - base);

  const chartData = {
    labels: weights.map((w) => w.label),
    datasets: [
      {
        data: normalizedData,
      },
    ],
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Top Bar */}
      <View
        style={{
          paddingTop: 40,
          padding: 24,
          backgroundColor: "#fff",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 25 }}>{"<"}</Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            marginLeft: 16,
          }}
        >
          Weight History
        </Text>
      </View>

      {/* Selected Value */}

      {/* Chart */}
      <View
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: 20,
          paddingVertical: 20,
          marginTop: 10,
        }}
      >
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: "700" }}>
            {weights[selectedIndex].value.toFixed(2)} kg
          </Text>
        </View>
        <View
          style={{
            height: 280,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <LineChart
            data={chartData}
            width={screenWidth - 48}
            height={220}
            fromZero={false}
            withInnerLines={true}
            withOuterLines={true}
            yAxisInterval={1}
            segments={4}
            yLabelsOffset={10}
            chartConfig={{
              backgroundGradientFrom: "#f8fafc",
              backgroundGradientTo: "#f8fafc",
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: () => "#64748b",
              propsForDots: {
                r: "5",
                strokeWidth: "2",
                stroke: "#2563eb",
              },
            }}
            bezier
            style={{
              borderRadius: 20,
            }}
            formatYLabel={(y) => Number(y).toFixed(1)}
           
          />
        </View>
      </View>

      <Text>Yo</Text>

      {/* Bottom Action Bar */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          padding: 16,
          borderTopWidth: 1,
          borderColor: "#eee",
          marginTop: "auto",
        }}
      >
        <TouchableOpacity>
          <Text style={{ fontSize: 16 }}>Change</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: "700" }}>+ Add Weight</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={{ fontSize: 16, color: "red" }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
