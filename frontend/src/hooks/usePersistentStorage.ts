import { useCallback } from "react";

const setCookie = (name: string, value: string, days = 7) => {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=None;Secure`;
    return true;
  } catch (error) {
    console.warn("Cookie operation failed:", error);
    return false;
  }
};

const getCookie = (name: string) => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
    return null;
  } catch (error) {
    console.warn("Cookie operation failed:", error);
    return null;
  }
};

const removeCookie = (name: string) => {
  try {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=None;Secure`;
    return true;
  } catch (error) {
    console.warn("Cookie operation failed:", error);
    return false;
  }
};

export const usePersistentStorage = () => {
  const safeStorageOperation = useCallback((operation: () => unknown) => {
    try {
      return operation();
    } catch (error) {
      console.warn("Storage operation failed:", error);
      return null;
    }
  }, []);

  const setItem = useCallback(
    (key: string, value: string) => {
      safeStorageOperation(() => localStorage.setItem(key, value));
      safeStorageOperation(() => sessionStorage.setItem(key, value));
      setCookie(key, value);
      return true;
    },
    [safeStorageOperation]
  );

  const getItem = useCallback(
    (key: string) => {
      let value = safeStorageOperation(() => localStorage.getItem(key)) as string | null;
      if (value === null) {
        value = safeStorageOperation(() => sessionStorage.getItem(key)) as string | null;
        if (value !== null) {
          safeStorageOperation(() => localStorage.setItem(key, value!));
        }
      }
      if (value === null) {
        value = getCookie(key);
        if (value !== null) {
          safeStorageOperation(() => localStorage.setItem(key, value!));
          safeStorageOperation(() => sessionStorage.setItem(key, value!));
        }
      }
      return value;
    },
    [safeStorageOperation]
  );

  const removeItem = useCallback(
    (key: string) => {
      safeStorageOperation(() => localStorage.removeItem(key));
      safeStorageOperation(() => sessionStorage.removeItem(key));
      removeCookie(key);
    },
    [safeStorageOperation]
  );

  const clear = useCallback(() => {
    safeStorageOperation(() => localStorage.clear());
    safeStorageOperation(() => sessionStorage.clear());
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      removeCookie(name);
    });
  }, [safeStorageOperation]);

  const key = useCallback(
    (index: number) => {
      let keyName = safeStorageOperation(() => localStorage.key(index)) as string | null;
      if (keyName === null) {
        keyName = safeStorageOperation(() => sessionStorage.key(index)) as string | null;
      }
      return keyName;
    },
    [safeStorageOperation]
  );

  const length = useCallback(() => {
    const localKeys = (safeStorageOperation(() => Object.keys(localStorage)) as string[]) || [];
    const sessionKeys = (safeStorageOperation(() => Object.keys(sessionStorage)) as string[]) || [];
    const cookieKeys = document.cookie.split(";").map((c) => c.split("=")[0].trim());
    return new Set([...localKeys, ...sessionKeys, ...cookieKeys]).size;
  }, [safeStorageOperation]);

  return {
    setItem,
    getItem,
    removeItem,
    clear,
    key,
    get length() {
      return length();
    },
  };
};
