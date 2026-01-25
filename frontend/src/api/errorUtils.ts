import type { AxiosError } from "axios";

interface ErrorPayload {
  message?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
  error_description?: string;
  msg?: string;
  messages?: string[];
  data?: { message?: string; error?: string };
}

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
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
    if (typeof data.error_description === "string" && data.error_description.trim()) {
      return data.error_description.trim();
    }
    if (typeof data.msg === "string" && data.msg.trim()) {
      return data.msg.trim();
    }
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
    if (Array.isArray(data.messages) && data.messages.length) {
      const first = data.messages[0];
      return typeof first === "string" ? first.trim() : "An error occurred";
    }
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

  if (axiosErr.message && typeof axiosErr.message === "string") {
    if (axiosErr.code === "ERR_NETWORK") {
      return "Network error. Please check your connection.";
    }
    if (axiosErr.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }
  }

  if (status === 401) return "Session expired. Please sign in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 422) return "Validation failed. Please check your input.";
  if (status && status >= 500) return "Something went wrong on our side. Please try again later.";

  return "An unexpected error occurred";
}
