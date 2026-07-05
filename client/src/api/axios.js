import axios from 'axios';

// Create an Axios instance with base URL pointing to the backend
const api = axios.create({
  // Use VITE_API_URL from environment variables for production (Vercel)
  // Fall back to localhost for local development
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Interceptor to attach the token to every request
api.interceptors.request.use((config) => {
  // We need to fetch the token from our in-memory store if possible,
  // but since Axios is outside React state, a common pattern without localStorage 
  // is to inject the token from the AuthContext upon login, or expose a setter here.
  // For simplicity without circular dependencies, we'll export a setter function.
  
  if (api.token) {
    config.headers.Authorization = `Bearer ${api.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Helper to set the token dynamically from AuthContext
export const setApiToken = (token) => {
  api.token = token;
};

export default api;
