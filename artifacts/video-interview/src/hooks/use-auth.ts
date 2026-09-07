import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";

export const TOKEN_KEY = "hr_token";

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const saveToken = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  // Sync token changes across tabs if necessary
  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem(TOKEN_KEY));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return { token, saveToken, clearToken };
}

export function useAuth() {
  const { token, saveToken, clearToken } = useAuthToken();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
    request: {
      headers: { Authorization: `Bearer ${token}` }
    }
  });

  const logout = useCallback(() => {
    clearToken();
    setLocation("/");
  }, [clearToken, setLocation]);

  // If token is invalid/expired
  useEffect(() => {
    if (isError && token) {
      logout();
    }
  }, [isError, token, logout]);

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated: !!user,
    token,
    saveToken,
    logout,
  };
}
