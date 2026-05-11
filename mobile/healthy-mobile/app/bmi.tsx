import { getProfile } from "@/api/profile.api";
import { useWeight } from "@/hooks/useWeight";
import { useI18n } from "@/context/I18nContext";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

const screenWidth = Dimensions.get("window").width;
const POINT_SPACING = 80;
const CHART_HEIGHT = 200;
const POINT_RADIUS = 5;

type BmiPoint = {
  value: number;
  date: string;
  weight: number;
};

function calculateBMI(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

function getBmiLabel(bmi: number, t: (key: string) => string) {
  if (bmi < 18.5) {
    return t("profile.underweight");
  }

  if (bmi < 25) {
    return t("profile.normalWeight");
  }

  if (bmi < 30) {
    return t("profile.overweight");
  }

  return t("profile.obese");
}

export default function Bmi() {
  const router = useRouter();
  const { t } = useI18n();
  const scrollViewRef = useRef<ScrollView>(null);
  const { weights, loading: weightLoading } = useWeight();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadProfile() {
        setLoadingProfile(true);
        setError(null);

        try {
          const profile = await getProfile();

          if (!isActive) {
            return;
          }

          setHeightCm(profile?.heightCm ?? null);
          setSelectedIndex(0);
        } catch (loadError: any) {
          if (!isActive) {
            return;
          }

          setError(loadError?.message ?? "Failed to load BMI data");
        } finally {
          if (isActive) {
            setLoadingProfile(false);
          }
        }
      }

      loadProfile();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const bmiPoints: BmiPoint[] = weights.map((weight) => ({
    value: heightCm ? calculateBMI(weight.weight, heightCm) : 0,
    date: weight.date,
    weight: weight.weight,
  }));

  const validSelectedIndex = Math.min(
    Math.max(selectedIndex, 0),
    Math.max(bmiPoints.length - 1, 0),
  );
  const selectedPoint = bmiPoints[validSelectedIndex] ?? null;

  const visibleValues = bmiPoints.map((point) => point.value);
  const visibleMax = visibleValues.length > 0 ? Math.max(...visibleValues) : 0;
  const visibleMin = visibleValues.length > 0 ? Math.min(...visibleValues) : 0;
  const maxValue = Math.ceil(visibleMax + 1);
  const minValue = Math.floor(visibleMin - 1);
  const range = Math.max(maxValue - minValue, 1);

  useEffect(() => {
    if (bmiPoints.length === 0) {
      return;
    }

    const pointXInSvg = validSelectedIndex * POINT_SPACING + screenWidth / 2;
    const baseOffset = pointXInSvg - screenWidth / 2;
    const maxScroll = (bmiPoints.length - 1) * POINT_SPACING;
    const scrollOffset = Math.max(0, Math.min(maxScroll, baseOffset));

    scrollViewRef.current?.scrollTo({
      x: scrollOffset,
      animated: true,
    });
  }, [bmiPoints.length, validSelectedIndex]);

  if (loadingProfile || weightLoading) {
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
          <Text style={{ color: "white", fontWeight: "700" }}>
            {t("profile.goBack")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!heightCm) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            marginBottom: 12,
            color: "#64748b",
            textAlign: "center",
          }}
        >
          {t("profile.addHeightToBmi")}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/profile")}
          style={{
            backgroundColor: "#2563eb",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            {t("profile.goToProfile")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (bmiPoints.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            marginBottom: 12,
            color: "#64748b",
            textAlign: "center",
          }}
        >
          {t("profile.noWeightRecords")}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/weight")}
          style={{
            backgroundColor: "#2563eb",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            {t("profile.goToWeight")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedBmi = selectedPoint?.value ?? 0;
  const bmiLabel = getBmiLabel(selectedBmi, t);

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
          {t("profile.bmiHistory")}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#f8fafc",
          paddingVertical: 20,
          marginTop: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "700" }}>
          {selectedBmi.toFixed(1)} {t("profile.bmi")}
        </Text>
        <Text style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
          {bmiLabel} · {t("profile.height")}: {heightCm} {t("weight.cm")}
        </Text>
      </View>

      <View
        style={{
          height: 280,
          position: "relative",
          backgroundColor: "#f8fafc",
        }}
      >
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
          {Array.from({ length: 5 }, (_, index) => {
            const value = maxValue - (index * range) / 4;

            return (
              <Text
                key={index}
                style={{
                  fontSize: 10,
                  color: "#64748b",
                  textAlign: "right",
                  paddingRight: 4,
                }}
              >
                {value.toFixed(1)}
              </Text>
            );
          })}
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate={0.95}
          onMomentumScrollEnd={(event: any) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const nearestIndex = Math.round(offsetX / POINT_SPACING);
            const nextIndex = Math.max(
              0,
              Math.min(nearestIndex, bmiPoints.length - 1),
            );
            setSelectedIndex(nextIndex);
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Svg
            width={bmiPoints.length * POINT_SPACING + screenWidth}
            height={280}
          >
            {Array.from({ length: 5 }, (_, index) => {
              const y = (index / 4) * CHART_HEIGHT + 30;

              return (
                <Line
                  key={`grid-${index}`}
                  x1={0}
                  y1={y}
                  x2={bmiPoints.length * POINT_SPACING + screenWidth}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              );
            })}

            <Polyline
              points={bmiPoints
                .map((point, index) => {
                  const x = index * POINT_SPACING + screenWidth / 2;
                  const normalizedValue =
                    ((point.value - minValue) / range) * CHART_HEIGHT;
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

            {bmiPoints.map((point, index) => {
              const x = index * POINT_SPACING + screenWidth / 2;
              const normalizedValue =
                ((point.value - minValue) / range) * CHART_HEIGHT;
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

      <View
        style={{
          marginHorizontal: 16,
          marginTop: 12,
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: "#e2e8f0",
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", marginBottom: 10 }}>
          {t("profile.bmiDetails")}
        </Text>

        <Text style={{ color: "#334155", marginBottom: 6 }}>
          {selectedPoint?.date ?? ""}
        </Text>
        <Text style={{ color: "#334155", marginBottom: 6 }}>
          {t("profile.weight")}:{" "}
          {selectedPoint ? selectedPoint.weight.toFixed(2) : "0.00"}{" "}
          {t("weight.kg")}
        </Text>
        <Text style={{ color: "#334155", marginBottom: 6 }}>
          {t("profile.height")}: {heightCm} {t("weight.cm")}
        </Text>
        <Text style={{ color: "#334155" }}>
          {t("profile.bmiCategory")}: {bmiLabel}
        </Text>
      </View>
    </View>
  );
}
