import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// Create an axios instance
const instance = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

// Interceptor for adding Authorization header
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Ensure config is cast to a valid type
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
