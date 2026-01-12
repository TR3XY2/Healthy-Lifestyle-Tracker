const API_URL = "http://10.0.2.2:5104/api";

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
}

async function request(url: string, options: RequestInit = {}) {
  console.log("REQUEST:", API_URL + url, options.body);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(API_URL + url, {
    ...options,
    headers,
  });

  console.log("RESPONSE STATUS:", res.status);

  if (!res.ok) {
    const text = await res.text();
    console.log("API ERROR:", text);
    throw new Error(text);
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

  get: (url: string) => request(url, { method: "GET" }),
};
