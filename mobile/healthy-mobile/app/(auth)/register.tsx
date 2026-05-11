import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    try {
      setLoading(true);
      await register(email, password);
      router.replace("/(app)/dashboard");
    } catch (e: any) {
      console.log("REGISTER ERROR:", e?.message);
      Alert.alert(t("auth.registerFailed"), e?.message ?? t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 24 }}>
        {t("auth.register")}
      </Text>

      <TextInput
        placeholder={t("auth.emailPlaceholder")}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={inputStyle}
      />
      <TextInput
        placeholder={t("auth.passwordPlaceholder")}
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
          {loading ? t("common.loading") : t("auth.register")}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/login")}>
        <Text style={{ textAlign: "center", marginTop: 16 }}>
          {t("auth.alreadyHaveAccount")} {t("auth.login")}
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
