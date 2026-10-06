import axios from 'axios';

export const AUTH_EXPIRED_EVENT = 'tammewar:auth-expired';

const sanitizeApiBase = (url) => {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  // Strip accidental "VITE_API_BASE_URL=" prefix if pasted into variable value
  if (clean.startsWith('VITE_API_BASE_URL=')) {
    clean = clean.slice('VITE_API_BASE_URL='.length).trim();
  }
  // Strip surrounding quotes
  clean = clean.replace(/^["']|["']$/g, '').trim();
  // Strip trailing slashes
  clean = clean.replace(/\/+$/, '');
  
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    // If backend URL does not already end in /result-analysis, append it
    if (!clean.endsWith('/result-analysis')) {
      clean = `${clean}/result-analysis`;
    }
  }
  return clean;
};

const configuredApiBase = sanitizeApiBase(import.meta.env.VITE_API_BASE_URL);
const apiBase = configuredApiBase || (import.meta.env.DEV ? '/api' : '');

if (!apiBase) {
  throw new Error('VITE_API_BASE_URL must be configured for production builds');
}

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = typeof token === 'string' && token ? token : null;
};

export const clearAccessToken = () => {
  accessToken = null;
};

const api = axios.create({
  baseURL: apiBase,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAccessToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    } else if (error.response?.status === 429) {
      error.message = error.response?.data?.error || 'Too many requests. Please wait a moment and try again.';
      error.isRateLimited = true;
    }
    return Promise.reject(error);
  },
);

export default api;
