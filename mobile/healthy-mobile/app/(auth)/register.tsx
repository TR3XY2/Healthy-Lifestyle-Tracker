import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";

export default function RegisterScreen() {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 24 }}>
        Create account
      </Text>

      <TextInput placeholder="Email" style={inputStyle} />
      <TextInput placeholder="Password" secureTextEntry style={inputStyle} />

      <Pressable style={buttonStyle} onPress={() => router.replace("/login")}>
        <Text style={{ color: "white", textAlign: "center" }}>
          Register
        </Text>
      </Pressable>
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  padding: 12,
  borderRadius: 8,
  marginBottom: 12,
};

const buttonStyle = {
  backgroundColor: "#16a34a",
  padding: 14,
  borderRadius: 8,
};
