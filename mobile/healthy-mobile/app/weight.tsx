import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Polyline, Circle, Line } from "react-native-svg";

const screenWidth = Dimensions.get("window").width;
const POINT_SPACING = 80;
const CHART_HEIGHT = 200;
const POINT_RADIUS = 5;

export default function Weight() {
  const router = useRouter();
  const scrollViewRef_inner = useRef<ScrollView>(null);

  const weights = [
    { value: 90, label: "1" },
    { value: 89.5, label: "2" },
    { value: 89, label: "3" },
    { value: 88.8, label: "4" },
    { value: 88.4, label: "5" },
    { value: 88, label: "6" },
    { value: 87.7, label: "7" },
    { value: 87.3, label: "8" },
    { value: 87, label: "9" },
  ];

  const [selectedIndex, setSelectedIndex] = useState(
    Math.floor(weights.length / 2),
  );

  // Calculate min and max from all visible points
  const visibleValues = weights.map((w) => w.value);
  const visibleMax = Math.max(...visibleValues);
  const visibleMin = Math.min(...visibleValues);

  const maxValue = Math.ceil(visibleMax + 2);
  const minValue = Math.floor(visibleMin - 2);
  const range = maxValue - minValue;

  const selectedValue = weights[selectedIndex].value;

  // Calculate scroll position to center selected point
  useEffect(() => {
    // Point x position in SVG is: index * POINT_SPACING + screenWidth / 2
    // To center it on screen, scroll so it's at screenWidth / 2
    const pointXInSvg = selectedIndex * POINT_SPACING + screenWidth / 2;
    const scrollOffset = Math.max(0, pointXInSvg - screenWidth / 2);
    scrollViewRef_inner.current?.scrollTo({
      x: scrollOffset,
      animated: true,
    });
  }, [selectedIndex]);

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
        <Text style={{ fontSize: 20, fontWeight: "700", marginLeft: 16 }}>
          Weight History
        </Text>
      </View>

      {/* Selected Value */}
      <View
        style={{
          backgroundColor: "#f8fafc",
          paddingVertical: 20,
          marginTop: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "700" }}>
          {selectedValue.toFixed(2)} kg
        </Text>
      </View>

      {/* Chart Container */}
      <View
        style={{
          height: 280,
          position: "relative",
          backgroundColor: "#f8fafc",
        }}
      >
        {/* Center Indicator Line */}
        <View
          style={{
            position: "absolute",
            left: screenWidth / 2 - 2,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: "#2563eb",
            opacity: 0.3,
            zIndex: 20,
            borderRadius: 2,
          }}
        />

        {/* Y-axis Labels */}
        <View
          style={{
            position: "absolute",
            left: 8,
            top: 0,
            bottom: 0,
            width: 40,
            justifyContent: "space-between",
            paddingVertical: 10,
            zIndex: 15,
          }}
        >
          {Array.from({ length: 5 }, (_, i) => {
            const value = maxValue - (i * range) / 4;
            return (
              <Text
                key={i}
                style={{
                  fontSize: 10,
                  color: "#64748b",
                  textAlign: "right",
                  paddingRight: 4,
                }}
              >
                {Math.round(value)}
              </Text>
            );
          })}
        </View>

        {/* Horizontal ScrollView for Chart */}
        <ScrollView
          ref={scrollViewRef_inner}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate={0.95}
          onMomentumScrollEnd={(event: any) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            // Calculate which point is centered (offsetX / POINT_SPACING rounded)
            const nearestIndex = Math.round(offsetX / POINT_SPACING);
            const nextIndex = Math.max(
              0,
              Math.min(nearestIndex, weights.length - 1),
            );
            setSelectedIndex(nextIndex);
          }}
          style={{ width: "100%", height: "100%" }}
        >
          {/* SVG Line Chart */}
          <Svg
            width={weights.length * POINT_SPACING + screenWidth}
            height={280}
          >
            {/* Grid lines */}
            {Array.from({ length: 5 }, (_, i) => {
              const y = (i / 4) * CHART_HEIGHT + 30;
              return (
                <Line
                  key={`grid-${i}`}
                  x1={0}
                  y1={y}
                  x2={weights.length * POINT_SPACING + screenWidth}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              );
            })}

            {/* Line connecting points */}
            <Polyline
              points={weights
                .map((weight, index) => {
                  const x = index * POINT_SPACING + screenWidth / 2;
                  const normalizedValue =
                    ((weight.value - minValue) / range) * CHART_HEIGHT;
                  const y = CHART_HEIGHT - normalizedValue + 30;
                  return `${x},${y}`;
                })
                .join(" ")}
              stroke="#2563eb"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {weights.map((weight, index) => {
              const x = index * POINT_SPACING + screenWidth / 2;
              const normalizedValue =
                ((weight.value - minValue) / range) * CHART_HEIGHT;
              const y = CHART_HEIGHT - normalizedValue + 30;
              const isSelected = index === selectedIndex;

              return (
                <Circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={isSelected ? 7 : POINT_RADIUS}
                  fill={isSelected ? "#1e40af" : "#2563eb"}
                  onPress={() => setSelectedIndex(index)}
                />
              );
            })}
          </Svg>
        </ScrollView>
      </View>

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
