import axios from 'axios';
import { STORAGE_KEYS } from '@/utils/constants';
import type { User } from '@/types';

/**
 * Pre-configured Axios instance for the EcoSphere API.
 * No requests are made from the frontend in this phase —
 * this file exists so the backend team can integrate without
 * touching call-site code.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  if (stored) {
    try {
      const user = JSON.parse(stored) as User & { token?: string };
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch {
      // corrupted storage — leave header unset
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error),
);

export default api;
