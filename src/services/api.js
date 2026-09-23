import { supabase } from '../lib/supabase';

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:5000/api');

/**
 * Helper to handle fetch requests with common headers, authentication, and error handling.
 */
export async function fetchApi(endpoint, options = {}, retries = 1) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api/')
    ? `${BASE_URL.slice(0, -4)}${cleanEndpoint}`
    : `${BASE_URL}${cleanEndpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // The backend uses requireAuth middleware, which checks for Authorization header
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (authErr) {
    console.warn('[API Auth] Session check warning:', authErr);
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    // If a connection refused / network error occurs during initial socket warmup, retry once
    if (retries > 0 && (error.name === 'TypeError' || error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError'))) {
      console.warn(`[API] Connection attempt failed for ${endpoint}, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 150));
      return fetchApi(endpoint, options, retries - 1);
    }

    if (error.name !== 'TypeError') {
      console.error(`[API Error] ${endpoint}:`, error.message || error);
    }
    throw error;
  }
}

export default {
  get: (endpoint, options) => fetchApi(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => fetchApi(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => fetchApi(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options) => fetchApi(endpoint, { ...options, method: 'DELETE' }),
};
