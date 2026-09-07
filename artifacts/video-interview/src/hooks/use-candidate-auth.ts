import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

export const CANDIDATE_TOKEN_KEY = "candidate_token";

interface CandidateUser {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  cvFileName: string | null;
  hasCv: boolean;
}

export function useCandidateAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(CANDIDATE_TOKEN_KEY));
  const [user, setUser] = useState<CandidateUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  const saveToken = useCallback((newToken: string) => {
    localStorage.setItem(CANDIDATE_TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem(CANDIDATE_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setLocation("/");
  }, [clearToken, setLocation]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}api/candidate-auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("invalid");
        const data = await res.json();
        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) {
          clearToken();
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token, clearToken]);

  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem(CANDIDATE_TOKEN_KEY));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated: !!user,
    token,
    saveToken,
    logout,
  };
}
