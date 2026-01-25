import React, { createContext, useContext, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { usePersistentStorage } from "../hooks/usePersistentStorage";
import { getItem, setItem, removeItem } from "../utils/persistentStorage";
import { StorageKey } from "../hooks/storage-data";
import { api } from "../api/client";

export interface User {
    id: string;
    username: string;
    email: string;
    coins_balance: number;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
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
    isTokenExpired: () => boolean;
    refreshToken: () => Promise<void>;
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

    const refreshToken = useCallback(async () => {
        const token = getItem(StorageKey.ACCESS_TOKEN);
        if (!token) return;
        setIsRefreshing(true);
        try {
            const data = (await api.post("/auth/refresh", { token })) as {
                access_token?: string;
                token?: string;
            };
            const newToken = data?.access_token ?? data?.token;
            if (newToken) {
                setItem(StorageKey.ACCESS_TOKEN, newToken);
            }
        } catch (err) {
            console.error("Error refreshing token:", err);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

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
        isTokenExpired,
        refreshToken,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
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
