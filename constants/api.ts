import Constants from 'expo-constants';

// Set EXPO_PUBLIC_API_BASE_URL in your .env file
export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'http://localhost:8000';
