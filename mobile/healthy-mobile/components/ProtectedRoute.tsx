import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
