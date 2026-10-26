import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In Android emulator, 10.0.2.2 points to host machine localhost:8000
// For physical devices on the local Wi-Fi, the host LAN IP (e.g. 192.168.1.16:8000) is used
export const DEFAULT_API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8000/api/v1' 
  : 'http://127.0.0.1:8000/api/v1';

export const api = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Load any custom API URL stored in AsyncStorage
AsyncStorage.getItem('smartspend_api_url')
  .then((savedUrl) => {
    if (savedUrl && savedUrl.trim()) {
      api.defaults.baseURL = savedUrl.trim();
    }
  })
  .catch((err) => console.log('Error reading stored API URL:', err));

export const setCustomApiUrl = async (url: string): Promise<void> => {
  const formatted = url.trim().replace(/\/+$/, '');
  const finalUrl = formatted.endsWith('/api/v1') ? formatted : `${formatted}/api/v1`;
  api.defaults.baseURL = finalUrl;
  await AsyncStorage.setItem('smartspend_api_url', finalUrl);
};

export const getApiUrl = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem('smartspend_api_url');
    return stored || api.defaults.baseURL || DEFAULT_API_URL;
  } catch {
    return api.defaults.baseURL || DEFAULT_API_URL;
  }
};

// Interceptor to attach JWT token
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('smartspend_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Error reading auth token:', err);
  }
  return config;
});

// Interceptor to handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['smartspend_token', 'smartspend_user']);
    }
    return Promise.reject(error);
  }
);
