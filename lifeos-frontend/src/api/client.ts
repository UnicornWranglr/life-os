// Axios instance with base URL and automatic JWT injection.
// All API modules import from here — never construct raw axios calls elsewhere.

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the stored JWT to every request
client.interceptors.request.use(config => {
  const token = localStorage.getItem('lifeos:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear the stored token and redirect to login.
// The React Router state will handle the redirect — we just wipe the token here
// so ProtectedRoute picks it up on the next render.
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lifeos:token');
      localStorage.removeItem('lifeos:user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
