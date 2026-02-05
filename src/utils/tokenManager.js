/**
 * Token Manager - Handles automatic token refresh
 * AccessToken expires in 10 minutes
 * RefreshToken expires in 120 days
 */

let refreshTimeout = null;

const TOKEN_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const REFRESH_BEFORE_TIME = 1 * 60 * 1000; // Refresh 1 minute before expiration

export const setupTokenRefresh = (refreshFunction) => {
  // Clear any existing timeout
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }

  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return;
  }

  // Schedule token refresh 9 minutes after login (1 minute before expiration)
  refreshTimeout = setTimeout(() => {
    console.log('Token expiring soon, refreshing...');
    refreshFunction();
    
    // Re-setup for next refresh
    setupTokenRefresh(refreshFunction);
  }, TOKEN_EXPIRY_TIME - REFRESH_BEFORE_TIME);
};

export const clearTokenRefresh = () => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
};

export const isTokenExpiringSoon = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return true;

  try {
    // Decode JWT to get expiration time
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const timeUntilExpiry = expirationTime - Date.now();
    
    // Return true if less than 2 minutes remaining
    return timeUntilExpiry < 2 * 60 * 1000;
  } catch (error) {
    console.warn('Error decoding token:', error);
    return true;
  }
};

export const getTokenExpiryTime = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.warn('Error decoding token:', error);
    return null;
  }
};
