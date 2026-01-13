import { View, Text, Pressable } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";

export default function Profile() {
  const { logout } = useAuth();

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>
        Profile
      </Text>

      <Pressable
        onPress={onLogout}
        style={{
          backgroundColor: "#dc2626",
          padding: 14,
          borderRadius: 8,
        }}
      >
        <Text
          style={{ color: "white", textAlign: "center", fontWeight: "600" }}
        >
          Logout
        </Text>
      </Pressable>
    </View>
  );
}
