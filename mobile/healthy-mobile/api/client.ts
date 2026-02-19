const API_URL = "http://192.168.0.19:5104/api";

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

  get: (url: string) => request(url, { method: "GET" }),

  delete: (url: string) => request(url, { method: "DELETE" }),
};
