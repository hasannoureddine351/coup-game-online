import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context.tsx";
import { getItem } from "../../utils/persistentStorage.ts";
import { StorageKey } from "../../hooks/storage-data/index.ts";

interface PrivateRouteProps {
  children?: unknown;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const navigate = useNavigate();
  const { isTokenExpired, refreshToken } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAuthentication = async () => {
      const token = getItem(StorageKey.ACCESS_TOKEN);

      if (!token) {
        if (!cancelled) {
          setIsRedirecting(true);
          navigate("/login", { replace: true });
        }
        return;
      }

      if (isTokenExpired()) {
        try {
          await refreshToken();
          if (cancelled) return;
          if (isTokenExpired()) {
            setIsRedirecting(true);
            navigate("/login", { replace: true });
            return;
          }
        } catch {
          if (!cancelled) {
            setIsRedirecting(true);
            navigate("/login", { replace: true });
          }
          return;
        }
      }

      if (!cancelled) {
        setIsValidating(false);
        setAuthCheckComplete(true);
      }
    };

    checkAuthentication();
    return () => {
      cancelled = true;
    };
  }, [navigate, isTokenExpired, refreshToken]);

  if (isRedirecting) {
    return null;
  }

  if (isValidating || !authCheckComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-t-transparent border-current" />
      </div>
    );
  }

  return <>{children}</>;
}
