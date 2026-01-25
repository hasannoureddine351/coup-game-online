import { useCallback } from "react";

// Cookie helper functions
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
  // Safe storage operations with error handling
  const safeStorageOperation = useCallback((operation: () => any) => {
    try {
      return operation();
    } catch (error) {
      console.warn("Storage operation failed:", error);
      return null;
    }
  }, []);

  // setItem - always stores in localStorage, sessionStorage, and cookies
  const setItem = useCallback(
    (key: string, value: string) => {
      safeStorageOperation(() => {
        localStorage.setItem(key, value);
      });
      safeStorageOperation(() => {
        sessionStorage.setItem(key, value);
      });
      setCookie(key, value); // Always set cookie
      return true;
    },
    [safeStorageOperation]
  );

  // getItem - tries localStorage first, falls back to sessionStorage, then cookies
  const getItem = useCallback(
    (key: string) => {
      // Try localStorage first
      let value = safeStorageOperation(() => {
        const v = localStorage.getItem(key);
        return v;
      });

      // If not found in localStorage, try sessionStorage
      if (value === null) {
        value = safeStorageOperation(() => {
          const v = sessionStorage.getItem(key);
          return v;
        });

        // If found in sessionStorage, restore to localStorage
        if (value !== null) {
          safeStorageOperation(() => {
            localStorage.setItem(key, value);
          });
        }
      }

      // If still not found, try cookies
      if (value === null) {
        value = getCookie(key);

        // If found in cookies, restore to localStorage and sessionStorage
        if (value !== null) {
          safeStorageOperation(() => {});
          safeStorageOperation(() => {
            sessionStorage.setItem(key, value);
          });
        }
      }

      return value;
    },
    [safeStorageOperation]
  );

  // removeItem - removes from all storage types
  const removeItem = useCallback(
    (key: string) => {
      safeStorageOperation(() => {
        localStorage.removeItem(key);
      });
      safeStorageOperation(() => {
        sessionStorage.removeItem(key);
      });

      removeCookie(key);
    },
    [safeStorageOperation]
  );

  // clear - clears all storage types
  const clear = useCallback(() => {
    safeStorageOperation(() => {
      localStorage.clear();
    });
    safeStorageOperation(() => {
      sessionStorage.clear();
    });
    // Clear all cookies that match our pattern
    const cookies = document.cookie.split(";");
    cookies.forEach((cookie) => {
      const name = cookie.split("=")[0].trim();

      removeCookie(name);
    });
  }, [safeStorageOperation]);

  // key - gets key at index from localStorage, falls back to sessionStorage
  const key = useCallback(
    (index: number) => {
      let keyName = safeStorageOperation(() => localStorage.key(index));

      if (keyName === null) {
        keyName = safeStorageOperation(() => sessionStorage.key(index));
      }

      return keyName;
    },
    [safeStorageOperation]
  );

  // length - gets combined length (avoiding duplicates)
  const length = useCallback(() => {
    const localKeys =
      safeStorageOperation(() => Object.keys(localStorage)) || [];
    const sessionKeys =
      safeStorageOperation(() => Object.keys(sessionStorage)) || [];
    const cookieKeys = document.cookie
      .split(";")
      .map((cookie) => cookie.split("=")[0].trim());
    const uniqueKeys = new Set([...localKeys, ...sessionKeys, ...cookieKeys]);
    return uniqueKeys.size;
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
