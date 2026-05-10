import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { setToken, setRefreshToken } from "../api/client";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
  getTokenExpiresAt,
} from "../storage/token.storage";
import * as AuthApi from "../api/auth.api";
import { useRouter } from "expo-router";

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuth] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await AuthApi.logout();
    } catch (error) {
      console.log("Logout API call failed (expected):", error);
    }

    await clearTokens();
    setToken(null);
    setRefreshToken(null);
    setAuth(false);
    router.replace("/(auth)/login");
  }, [router]);

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getRefreshToken();
      if (!token) {
        await logout();
        return false;
      }

      const res = await AuthApi.refreshToken(token);

      await saveTokens(res.accessToken, res.refreshToken, res.expiresIn);
      setToken(res.accessToken);
      setRefreshToken(res.refreshToken);

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      await logout();
      return false;
    }
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = await getAccessToken();
        const refreshToken = await getRefreshToken();

        if (accessToken && refreshToken) {
          setToken(accessToken);
          setRefreshToken(refreshToken);
          setAuth(true);

          const expiresAt = await getTokenExpiresAt();
          if (expiresAt) {
            const now = Date.now();
            const timeUntilExpiry = expiresAt.getTime() - now;
            const fiveMinutes = 5 * 60 * 1000;

            if (timeUntilExpiry < fiveMinutes) {
              await refreshAccessToken();
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        await clearTokens();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [refreshAccessToken]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const interval = setInterval(async () => {
      const expiresAt = await getTokenExpiresAt();
      if (!expiresAt) {
        return;
      }

      const now = Date.now();
      const timeUntilExpiry = expiresAt.getTime() - now;
      const fiveMinutes = 5 * 60 * 1000;

      if (timeUntilExpiry < fiveMinutes) {
        await refreshAccessToken();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshAccessToken]);

  async function login(email: string, password: string) {
    try {
      const res = await AuthApi.login(email, password);

      await saveTokens(res.accessToken, res.refreshToken, res.expiresIn);
      setToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      setAuth(true);
    } catch (error: any) {
      if (error.status === 401) {
        throw new Error("Wrong email or password");
      }
      throw new Error("Login failed. Please try again.");
    }
  }

  async function register(email: string, password: string) {
    const res = await AuthApi.register(email, password);

    await saveTokens(res.accessToken, res.refreshToken, res.expiresIn);
    setToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    setAuth(true);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
