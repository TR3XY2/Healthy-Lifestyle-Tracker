import { createContext, useContext, useEffect, useState } from "react";
import { setToken } from "../api/client";
import { getToken, saveToken, clearToken } from "../storage/token.storage";
import * as AuthApi from "../api/auth.api";

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuth] = useState(false);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    getToken()
      .then((token) => {
        if (token) {
          setToken(token);
          setAuth(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await AuthApi.login(email, password);
    await saveToken(res.token);
    setToken(res.token);
    setAuth(true);
  }

  async function logout() {
    await clearToken();
    setToken(null);
    setAuth(false);
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
