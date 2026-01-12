import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    try {
      setLoading(true);
      await login(email, password);
      router.replace("/(app)/dashboard");
    } catch (e: any) {
      console.log("LOGIN ERROR:", e?.message);
      Alert.alert("Login failed", e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 24 }}>
        Welcome back
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 8,
          marginBottom: 12,
        }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <Pressable
        style={{
          marginTop: 20,
          backgroundColor: "#2563eb",
          padding: 14,
          borderRadius: 8,
          opacity: loading ? 0.6 : 1,
        }}
        disabled={loading}
        onPress={onLogin}
      >
        <Text
          style={{ color: "white", textAlign: "center", fontWeight: "600" }}
        >
          {loading ? "Logging in..." : "Login"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/register")}>
        <Text style={{ textAlign: "center", marginTop: 16 }}>
          Don’t have an account? Register
        </Text>
      </Pressable>
    </View>
  );
}
