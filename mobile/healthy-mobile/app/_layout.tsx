import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthProvider>
    </I18nProvider>
  );
}
