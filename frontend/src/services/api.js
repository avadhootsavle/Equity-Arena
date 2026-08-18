// Environment-driven API base URL (Vite environment variable for Vercel deployment & ngrok backend tunneling)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('ignite_token');
  
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1', // Bypass ngrok free tier browser warning interstitial page
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If token is invalid or expired (401 / 403), auto-clean stale auth & redirect to login
    if ((response.status === 401 || response.status === 403) && typeof window !== 'undefined') {
      localStorage.removeItem('ignite_token');
      localStorage.removeItem('ignite_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
