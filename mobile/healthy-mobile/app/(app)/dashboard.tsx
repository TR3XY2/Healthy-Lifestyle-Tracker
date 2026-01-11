import { View, Text } from "react-native";

const card = {
  marginTop: 16,
  padding: 16,
  borderRadius: 12,
  backgroundColor: "#f1f5f9",
};

const value = {
  fontSize: 22,
  fontWeight: "600",
};

export default function Dashboard() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Today</Text>

      <View style={card}>
        <Text>Steps</Text>
        <Text style={value}>7,200</Text>
      </View>

      <View style={card}>
        <Text>Weight</Text>
        <Text style={value}>72.4 kg</Text>
      </View>
    </View>
  );
}