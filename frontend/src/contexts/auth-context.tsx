import React, { createContext, useContext, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { usePersistentStorage } from "../hooks/usePersistentStorage.ts";
import { getItem, setItem, removeItem } from "../utils/persistentStorage.ts";
import { StorageKey } from "../hooks/storage-data/index.ts";
import { authService } from "../api/services/authService.ts";
import type { User } from "../api/types.ts";
import type { SignupPayload } from "../api/types.ts";

export type { User };

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  error: string | null;
  setError: (err: string | null) => void;
  isRefreshing: boolean;
  setIsRefreshing: (refreshing: boolean) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  isTokenExpired: () => boolean;
  refreshToken: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext(undefined as AuthContextType | undefined);

export const AuthProvider = ({ children }: { children?: unknown }) => {
  const storage = usePersistentStorage();
  const [currentUser, setCurrentUser] = useState(null as User | null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null as string | null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const isTokenExpired = useCallback(() => {
    const token = getItem(StorageKey.ACCESS_TOKEN);
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      const exp = decoded.exp;
      return exp != null && exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const data = await authService.login({ email, password });
        const token = data?.access_token ?? data?.token;
        const user = data?.user;
        if (token) {
          setItem(StorageKey.ACCESS_TOKEN, token);
          storage.setItem(StorageKey.ACCESS_TOKEN, token);
        }
        if (user) setCurrentUser(user);
        setIsLoggedIn(true);
        setIsAuthenticated(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Login failed";
        setError(message);
        throw err;
      }
    },
    [storage]
  );

  const signup = useCallback(
    async (payload: SignupPayload) => {
      setError(null);
      try {
        const data = await authService.signup(payload);
        const token = data?.access_token ?? data?.token;
        const user = data?.user;
        if (token) {
          setItem(StorageKey.ACCESS_TOKEN, token);
          storage.setItem(StorageKey.ACCESS_TOKEN, token);
        }
        if (user) setCurrentUser(user);
        setIsLoggedIn(true);
        setIsAuthenticated(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Sign up failed";
        setError(message);
        throw err;
      }
    },
    [storage]
  );

  const refreshToken = useCallback(async () => {
    const token = getItem(StorageKey.ACCESS_TOKEN);
    if (!token) return;
    setIsRefreshing(true);
    try {
      const data = await authService.refreshToken(token);
      const newToken = data?.access_token ?? data?.token;
      if (newToken) {
        setItem(StorageKey.ACCESS_TOKEN, newToken);
        storage.setItem(StorageKey.ACCESS_TOKEN, newToken);
      }
    } catch (err) {
      console.error("Error refreshing token:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [storage]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsLoggedIn(false);
    removeItem(StorageKey.ACCESS_TOKEN);
    storage.removeItem(StorageKey.ACCESS_TOKEN);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, [storage]);

  const value: AuthContextType = {
    user: currentUser,
    currentUser,
    setCurrentUser,
    isLoading,
    setIsLoading,
    isAuthenticated,
    setIsAuthenticated,
    error,
    setError,
    isRefreshing,
    setIsRefreshing,
    isLoggedIn,
    setIsLoggedIn,
    logout,
    login,
    signup,
    isTokenExpired,
    refreshToken,
    token: getItem(StorageKey.ACCESS_TOKEN),
  };

  return (
    <AuthContext.Provider value={value}>
      {children as React.ReactNode}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
