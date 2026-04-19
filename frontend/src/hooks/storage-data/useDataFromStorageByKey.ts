import { useMemo } from "react";
import { usePersistentStorage } from "../usePersistentStorage";
import { StorageKey } from "./constants";

export const useDataFromStorageByKey = (key: StorageKey) => {
  const storage = usePersistentStorage();

  const data = useMemo(() => {
    try {
      const item = storage.getItem(key);
      if (!item) return null;

      if (key === StorageKey.ACCESS_TOKEN) {
        return item;
      }

      return JSON.parse(item);
    } catch {
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- storage omitted to avoid redundant re-runs
  }, [key]);

  return data;
};
