import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In Android emulator, 10.0.2.2 points to host localhost:8000
// In Web / iOS, localhost:8000 points to host directly
const DEFAULT_API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8000/api/v1' 
  : 'http://127.0.0.1:8000/api/v1';

export const api = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
