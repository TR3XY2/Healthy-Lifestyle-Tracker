import { saveTokens } from "@/storage/token.storage";

const API_URL = "http://192.168.0.19:5104/api";

let authToken: string | null = null;
let refreshToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    if (!refreshToken) {
      return false;
    }

    const res = await fetch(API_URL + "/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(refreshToken),
    });

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    authToken = data.accessToken;
    refreshToken = data.refreshToken;

    // Save new tokens
    await saveTokens(data.accessToken, data.refreshToken, data.expiresIn);

    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

async function request(url: string, options: RequestInit = {}) {
  console.log("REQUEST:", API_URL + url, options.body);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let res = await fetch(API_URL + url, {
    ...options,
    headers,
  });

  console.log("RESPONSE STATUS:", res.status);

  // Handle 401 Unauthorized - try to refresh
  if (res.status === 401) {
    console.log("Token expired, attempting refresh...");

    const refreshSuccessful = await refreshAccessToken();

    if (refreshSuccessful && authToken) {
      // Retry with new token
      headers.Authorization = `Bearer ${authToken}`;
      res = await fetch(API_URL + url, {
        ...options,
        headers,
      });

      console.log("RETRY RESPONSE STATUS:", res.status);
    } else {
      // Refresh failed - will be handled by AuthContext
      throw { status: 401, message: "Session expired. Please login again." };
    }
  }

  if (!res.ok) {
    const text = await res.text();
    console.log("API ERROR:", text);

    throw {
      status: res.status,
      message: text,
    };
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null;
  }

  const json = await res.json();
  console.log("API OK:", json);
  return json;
}

export const api = {
  post: (url: string, body?: any) =>
    request(url, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (url: string, body?: any) =>
    request(url, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  get: (url: string) => request(url, { method: "GET" }),

  delete: (url: string) => request(url, { method: "DELETE" }),
};
