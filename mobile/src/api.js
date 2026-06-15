import { Platform } from "react-native";

export const defaultApiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  Platform.select({
    android: "http://10.0.2.2:5000",
    ios: "https://portfolio-quwt.onrender.com",
    default: "https://portfolio-quwt.onrender.com",
  });

export const normalizeApiUrl = (value) => value.trim().replace(/\/+$/, "");

export const apiRequest = async (apiUrl, path, options = {}) => {
  const response = await fetch(`${normalizeApiUrl(apiUrl)}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}.`);
  }

  return data;
};
