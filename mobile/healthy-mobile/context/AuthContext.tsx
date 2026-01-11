import { createContext, useContext, useEffect, useState } from "react";
import { setToken } from "../api/client";
import { getToken, saveToken, clearToken } from "../storage/token.storage";
import * as AuthApi from "../api/auth.api";

type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuth] = useState(false);

  useEffect(() => {
    getToken().then((token) => {
      if (token) {
        setToken(token);
        setAuth(true);
      }
    });
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
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
