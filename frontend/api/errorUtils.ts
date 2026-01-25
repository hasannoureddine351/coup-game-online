import type { AxiosError } from "axios";

/** Shape of typical Laravel / JSON API error responses */
interface ErrorPayload {
  message?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
  error_description?: string;
  msg?: string;
  messages?: string[];
  data?: { message?: string; error?: string };
}

/**
 * Extracts a user‑friendly error message from an API error.
 * Handles multiple common backend formats and lifts the message up gracefully.
 */
export function extractErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "An unexpected error occurred";
  }

  const axiosErr = error as AxiosError<ErrorPayload | string>;
  const data = axiosErr.response?.data;
  const status = axiosErr.response?.status;

  if (typeof data === "string") {
    return data.trim() || "An unexpected error occurred";
  }

  if (data && typeof data === "object") {
    // 1. message (Laravel, many APIs)
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }

    // 2. error
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error.trim();
    }

    // 3. error_description (OAuth-style)
    if (typeof data.error_description === "string" && data.error_description.trim()) {
      return data.error_description.trim();
    }

    // 4. msg
    if (typeof data.msg === "string" && data.msg.trim()) {
      return data.msg.trim();
    }

    // 5. errors (Laravel validation) – use first field's first message
    if (data.errors && typeof data.errors === "object") {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first) && first.length) {
        const msg = first[0];
        return typeof msg === "string" ? msg.trim() : "Validation failed";
      }
      if (typeof first === "string" && first.trim()) {
        return first.trim();
      }
    }

    // 6. messages (array)
    if (Array.isArray(data.messages) && data.messages.length) {
      const first = data.messages[0];
      return typeof first === "string" ? first.trim() : "An error occurred";
    }

    // 7. data.message / data.error (nested)
    const inner = data.data;
    if (inner && typeof inner === "object") {
      if (typeof inner.message === "string" && inner.message.trim()) {
        return inner.message.trim();
      }
      if (typeof inner.error === "string" && inner.error.trim()) {
        return inner.error.trim();
      }
    }
  }

  // Network / client errors
  if (axiosErr.message && typeof axiosErr.message === "string") {
    if (axiosErr.code === "ERR_NETWORK") {
      return "Network error. Please check your connection.";
    }
    if (axiosErr.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }
  }

  // Status-based fallbacks
  if (status === 401) return "Session expired. Please sign in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 422) return "Validation failed. Please check your input.";
  if (status && status >= 500) return "Something went wrong on our side. Please try again later.";

  return "An unexpected error occurred";
}
