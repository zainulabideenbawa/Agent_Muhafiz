// src/frontend/utils/auth.js

export const setToken = (token) => localStorage.setItem('auth_token', token);
export const getToken = () => localStorage.getItem('auth_token');
export const clearToken = () => localStorage.removeItem('auth_token');

export const authHeaders = (headers = {}) => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const authenticatedFetch = async (url, options = {}) => {
  const headers = authHeaders(options.headers || {});
  return fetch(url, {
    ...options,
    headers,
  });
};
