import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  1;

  const onRegister = async () => {
    try {
      setLoading(true);
      await register(email, password);
      Alert.alert("Success", "Account created. Please log in.");
      router.replace("/login");
    } catch (e: any) {
      console.log("REGISTER ERROR:", e?.message);
      Alert.alert("Register failed", e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 24 }}>
        Create account
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={inputStyle}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={inputStyle}
      />

      <Pressable
        style={{
          ...buttonStyle,
          opacity: loading ? 0.6 : 1,
        }}
        onPress={onRegister}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          {loading ? "Creating..." : "Register"}
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
