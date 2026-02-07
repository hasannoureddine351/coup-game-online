// Utility for persistent storage access outside React hooks
export function getItem(key: string): string | null {
  if (typeof window !== "undefined") {
    try {
      return (
        window.localStorage.getItem(key) || window.sessionStorage.getItem(key)
      );
    } catch {
      return null;
    }
  }
  return null;
}

export function setItem(key: string, value: string): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      try {
        window.sessionStorage.setItem(key, value);
      } catch {}
    }
  }
}

export function removeItem(key: string): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {}
  }
}

export function clear(): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {}
  }
}

