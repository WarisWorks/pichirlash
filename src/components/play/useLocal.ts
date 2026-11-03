import { useState, useEffect } from "react";
export function loadLocal<T>(
  key: string,
  fallback: T,
  validate: (v: unknown) => v is T,
): T {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) || "null");
    return validate(v) ? v : fallback;
  } catch {
    return fallback;
  }
}
export function useLocal<T>(
  key: string,
  fallback: T,
  validate: (v: unknown) => v is T,
  override?: T,
) {
  const [value, setValue] = useState<T>(
    () => override ?? loadLocal(key, fallback, validate),
  );
  const [error, setError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setError(false);
    } catch {
      setError(true);
    }
  }, [key, value]);
  return { value, setValue, error };
}
