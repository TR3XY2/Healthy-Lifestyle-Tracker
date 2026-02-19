import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Polyline, Circle, Line } from "react-native-svg";
import { useWeight } from "../hooks/useWeight";

const screenWidth = Dimensions.get("window").width;
const POINT_SPACING = 80;
const CHART_HEIGHT = 200;
const POINT_RADIUS = 5;

export default function Weight() {
  const router = useRouter();
  const scrollViewRef_inner = useRef<ScrollView>(null);
  const { weights: apiWeights, loading, error, add, remove } = useWeight();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newDate, setNewDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const weights = apiWeights.map((w, index) => ({
    value: w.weight,
    label: (index + 1).toString(),
    date: w.date,
  }));

  const [selectedIndex, setSelectedIndex] = useState(
    Math.max(0, weights.length - 1),
  );

  const visibleValues = weights.map((w) => w.value);
  const visibleMax = Math.max(...visibleValues);
  const visibleMin = Math.min(...visibleValues);

  const maxValue = Math.ceil(visibleMax + 2);
  const minValue = Math.floor(visibleMin - 2);
  const range = maxValue - minValue;

  const validSelectedIndex = Math.min(selectedIndex, weights.length - 1);
  const selectedValue = weights[validSelectedIndex]?.value || 0;
  const showLatestChanges = validSelectedIndex >= 3;

  const currentWeightRecord = weights[validSelectedIndex];
  const previousWeightRecord =
    validSelectedIndex >= 1 ? weights[validSelectedIndex - 1] : undefined;
  const threeBeforeWeightRecord =
    validSelectedIndex >= 3 ? weights[validSelectedIndex - 3] : undefined;

  const previousDelta =
    currentWeightRecord && previousWeightRecord
      ? currentWeightRecord.value - previousWeightRecord.value
      : 0;
  const threeBeforeDelta =
    currentWeightRecord && threeBeforeWeightRecord
      ? currentWeightRecord.value - threeBeforeWeightRecord.value
      : 0;

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return "#dc2626";
    if (delta < 0) return "#16a34a";
    return "#64748b";
  };

  const getDeltaArrow = (delta: number) => {
    if (delta > 0) return "▲";
    if (delta < 0) return "▼";
    return "";
  };

  const formatDeltaText = (delta: number) => {
    if (delta === 0) return "0.00 kg";
    return `${delta > 0 ? "+" : ""}${delta.toFixed(2)} kg`;
  };

  const handleAddWeight = async () => {
    if (!newWeight || !newDate) {
      Alert.alert("Error", "Please enter both weight and date");
      return;
    }

    const weightValue = parseFloat(newWeight);
    if (isNaN(weightValue) || weightValue <= 0) {
      Alert.alert("Error", "Please enter a valid weight");
      return;
    }

    try {
      setSubmitting(true);
      await add({ weight: weightValue, date: newDate });
      setShowAddModal(false);
      setNewWeight("");
      setNewDate("");
      Alert.alert("Success", "Weight added successfully");
    } catch {
      Alert.alert("Error", "Failed to add weight");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWeight = async () => {
    if (weights.length === 0) {
      return;
    }

    const validIndex = Math.min(selectedIndex, weights.length - 1);
    const selectedWeight = weights[validIndex];
    Alert.alert(
      "Delete Weight",
      `Are you sure you want to delete the weight record from ${selectedWeight.date}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(selectedWeight.date);
              Alert.alert("Success", "Weight deleted successfully");
              // Adjust selectedIndex if necessary
              if (selectedIndex >= weights.length - 1) {
                setSelectedIndex(Math.max(0, weights.length - 2));
              }
            } catch {
              Alert.alert("Error", "Failed to delete weight");
            }
          },
        },
      ],
    );
  };

  const openAddModal = () => {
    // Set default date to today
    const today = new Date().toISOString().split("T")[0];
    setNewDate(today);
    setShowAddModal(true);
  };

  useEffect(() => {
    if (weights.length === 0) return;

    const validIndex = Math.min(selectedIndex, weights.length - 1);
    const pointXInSvg = validIndex * POINT_SPACING + screenWidth / 2;
    const baseOffset = pointXInSvg - screenWidth / 2;
    const maxScroll = (weights.length - 1) * POINT_SPACING;
    const scrollOffset = Math.max(0, Math.min(maxScroll, baseOffset));
    scrollViewRef_inner.current?.scrollTo({
      x: scrollOffset,
      animated: true,
    });
  }, [selectedIndex, weights.length]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red", marginBottom: 16 }}>{error}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: "#2563eb",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (weights.length === 0) {
    return (
      <View style={{ flex: 1 }}>
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
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 18, marginBottom: 24, color: "#64748b" }}>
            No weight records yet
          </Text>
          <TouchableOpacity
            onPress={openAddModal}
            style={{
              backgroundColor: "#2563eb",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              + Add Weight
            </Text>
          </TouchableOpacity>
        </View>
        <Modal visible={showAddModal} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                padding: 24,
                borderRadius: 16,
                width: "80%",
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}
              >
                Add Weight
              </Text>
              <Text style={{ marginBottom: 8 }}>Weight (kg)</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
                placeholder="Enter weight"
                keyboardType="decimal-pad"
                value={newWeight}
                onChangeText={setNewWeight}
              />
              <Text style={{ marginBottom: 8 }}>Date</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 24,
                }}
                placeholder="YYYY-MM-DD"
                value={newDate}
                onChangeText={setNewDate}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    marginRight: 8,
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#ddd",
                  }}
                >
                  <Text style={{ textAlign: "center", fontWeight: "600" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddWeight}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    paddingVertical: 12,
                    borderRadius: 8,
                    backgroundColor: submitting ? "#94a3b8" : "#2563eb",
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: "white",
                      fontWeight: "600",
                    }}
                  >
                    {submitting ? "Adding..." : "Add"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

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
              const isSelected = index === validSelectedIndex;

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

      {showLatestChanges && currentWeightRecord && (
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            marginBottom: 8,
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: "#e2e8f0",
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", marginBottom: 10 }}>
            Latest Weight Changes
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#f8fafc",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                Previous
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {getDeltaArrow(previousDelta) ? (
                  <Text
                    style={{
                      fontSize: 12,
                      marginRight: 6,
                      color: getDeltaColor(previousDelta),
                    }}
                  >
                    {getDeltaArrow(previousDelta)}
                  </Text>
                ) : null}
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: getDeltaColor(previousDelta),
                  }}
                >
                  {formatDeltaText(previousDelta)}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                {previousWeightRecord
                  ? `${previousWeightRecord.date} → ${currentWeightRecord.date}`
                  : ""}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#f8fafc",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                3 Records Earlier
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {getDeltaArrow(threeBeforeDelta) ? (
                  <Text
                    style={{
                      fontSize: 12,
                      marginRight: 6,
                      color: getDeltaColor(threeBeforeDelta),
                    }}
                  >
                    {getDeltaArrow(threeBeforeDelta)}
                  </Text>
                ) : null}
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: getDeltaColor(threeBeforeDelta),
                  }}
                >
                  {formatDeltaText(threeBeforeDelta)}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                {threeBeforeWeightRecord
                  ? `${threeBeforeWeightRecord.date} → ${currentWeightRecord.date}`
                  : ""}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Bottom Action Bar */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          padding: 16,
          paddingBottom: 32,
          borderTopWidth: 1,
          borderColor: "#eee",
          marginTop: "auto",
        }}
      >
        <TouchableOpacity>
          <Text style={{ fontSize: 16 }}>Change</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openAddModal}>
          <Text style={{ fontSize: 16, fontWeight: "700" }}>+ Add Weight</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteWeight}>
          <Text style={{ fontSize: 16, color: "red" }}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Add Weight Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 24,
              borderRadius: 16,
              width: "80%",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>
              Add Weight
            </Text>
            <Text style={{ marginBottom: 8 }}>Weight (kg)</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
              placeholder="Enter weight"
              keyboardType="decimal-pad"
              value={newWeight}
              onChangeText={setNewWeight}
            />
            <Text style={{ marginBottom: 8 }}>Date</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                padding: 12,
                marginBottom: 24,
              }}
              placeholder="YYYY-MM-DD"
              value={newDate}
              onChangeText={setNewDate}
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                disabled={submitting}
                style={{
                  flex: 1,
                  marginRight: 8,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#ddd",
                }}
              >
                <Text style={{ textAlign: "center", fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddWeight}
                disabled={submitting}
                style={{
                  flex: 1,
                  marginLeft: 8,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: submitting ? "#94a3b8" : "#2563eb",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  {submitting ? "Adding..." : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
