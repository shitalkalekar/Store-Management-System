import axios from 'axios';

let apiBase = '/api';
let gatewayHeaders = {};

const api = axios.create({
  baseURL: apiBase
});

// Interceptor to inject tokens dynamically
api.interceptors.request.use((config) => {
  // 1. If we are running in standalone mode (no gateway token), look for MERN JWT token
  if (!gatewayHeaders.authToken) {
    const token = sessionStorage.getItem('sis_jwt_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // 2. If we have host gateway headers, attach them
  if (gatewayHeaders.authToken) {
    config.headers['X-Internal-Token'] = gatewayHeaders.authToken;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Initialize with host environment context
export const initApi = (runtimeCtx) => {
  if (runtimeCtx) {
    if (runtimeCtx.apiBaseUrl) {
      api.defaults.baseURL = runtimeCtx.apiBaseUrl;
    }
    gatewayHeaders = {
      authToken: runtimeCtx.authToken,
    };
  }
};

export default api;
