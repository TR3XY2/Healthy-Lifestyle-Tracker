const API_URL = "https://YOUR_BACKEND_URL/api";

let token: string | null = null;

export const setToken = (t: string | null) => {
  token = t;
};

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}
