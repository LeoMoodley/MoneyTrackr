import axios, { InternalAxiosRequestConfig, AxiosError } from "axios";

// Create an axios instance
const instance = axios.create({
  baseURL: "https://18.222.161.63/api/",
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const refreshToken = async (): Promise<string | null> => {
  try {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) throw new Error("No refresh token available");

    const response = await axios.post("https://moneytrackrz.netlify.app/api/token/refresh/", {
      refresh,
    });

    const newAccessToken = response.data.access;
    localStorage.setItem("access_token", newAccessToken);

    refreshSubscribers.forEach((callback) => callback(newAccessToken));
    refreshSubscribers = [];

    return newAccessToken;
  } catch (error) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login"; // Redirect to login if refresh fails
    return null;
  }
};

// ✅ **Request Interceptor Fix** ✅
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers || {}; // Ensure headers exist
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ **Response Interceptor Fix** ✅
instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            resolve(instance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const newToken = await refreshToken();
      isRefreshing = false;

      if (newToken) {
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return instance(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
