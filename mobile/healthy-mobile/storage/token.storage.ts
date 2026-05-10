import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "access_token_v2";
const REFRESH_TOKEN_KEY = "refresh_token_v2";
const TOKEN_EXPIRES_AT_KEY = "token_expires_at_v2";

export async function saveTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number, // seconds
) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  await SecureStore.setItemAsync(TOKEN_EXPIRES_AT_KEY, expiresAt.toISOString());
}

export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function getTokenExpiresAt(): Promise<Date | null> {
  const expiresAtStr = await SecureStore.getItemAsync(TOKEN_EXPIRES_AT_KEY);
  return expiresAtStr ? new Date(expiresAtStr) : null;
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(TOKEN_EXPIRES_AT_KEY);
}

// Backward compatibility
export async function getToken(): Promise<string | null> {
  return await getAccessToken();
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearToken() {
  await clearTokens();
}
