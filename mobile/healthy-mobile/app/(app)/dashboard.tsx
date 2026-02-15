import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { getWeightHistory } from "@/api/weight.api";

const card = {
  marginTop: 16,
  padding: 20,
  borderRadius: 16,
  backgroundColor: "#f1f5f9",
};

const value = {
  fontSize: 28,
  fontWeight: "700" as const,
};

export default function Dashboard() {
  const router = useRouter();
  const [weights, setWeights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeights();
  }, []);

  async function loadWeights() {
    try {
      const data = await getWeightHistory();
      setWeights(data);
    } catch (err) {
      console.log("Failed to load weights", err);
    } finally {
      setLoading(false);
    }
  }

  const latestWeight =
    weights.length > 0 ? weights[weights.length - 1] : null;

  function calculateBMI(weightKg: number, heightCm: number) {
    const h = heightCm / 100;
    return Number((weightKg / (h * h)).toFixed(1));
  }

  // For now mock height until profile is connected
  const heightCm = 170;

  const bmi =
    latestWeight && heightCm
      ? calculateBMI(latestWeight.weight, heightCm)
      : null;

  return (
    <View style={{ flex: 1, padding: 24 }}>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          {/* Weight Card */}
          <TouchableOpacity
            style={card}
            onPress={() => router.push("/weight")}
          >
            <Text style={{ fontSize: 18, marginBottom: 8 }}>Weight</Text>

            {latestWeight ? (
              <>
                <Text style={value}>
                  {latestWeight.weight.toFixed(2)} kg
                </Text>
                <Text style={{ marginTop: 4, color: "#64748b" }}>
                  Latest entry
                </Text>
              </>
            ) : (
              <Text>No data yet</Text>
            )}
          </TouchableOpacity>

          {/* BMI Card */}
          <TouchableOpacity
            style={card}
            onPress={() => router.push("/bmi")}
          >
            <Text style={{ fontSize: 18, marginBottom: 8 }}>BMI</Text>

            {bmi ? (
              <>
                <Text style={value}>{bmi}</Text>
                <Text style={{ marginTop: 4, color: "#64748b" }}>
                  Body Mass Index
                </Text>
              </>
            ) : (
              <Text>Add height to enable BMI</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
