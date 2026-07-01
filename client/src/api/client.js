import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  withCredentials: true, // send the refresh-token cookie
});

let accessToken = null;
let isRefreshing = false;
let refreshSubscribers = [];

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // If access token expired (401) and we haven't already retried this request,
    // attempt a silent refresh using the httpOnly refresh-token cookie.
    if (response?.status === 401 && !config._retry && !config.url.includes('/auth/refresh')) {
      config._retry = true;

      if (isRefreshing) {
        // Queue this request until the in-flight refresh completes.
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((newToken) => {
            if (!newToken) return reject(error);
            config.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(config));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data?.data?.accessToken;
        setAccessToken(newToken);
        isRefreshing = false;
        onRefreshed(newToken);
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      } catch (refreshErr) {
        isRefreshing = false;
        onRefreshed(null);
        setAccessToken(null);
        // Let callers (AuthContext) handle redirect-to-login.
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
