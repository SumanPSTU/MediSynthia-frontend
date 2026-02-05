import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});
 
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401 response
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If response is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Call refresh token endpoint
        const response = await axiosClient.post("/user/refresh-token", { refreshToken });

        if (response.data?.success && response.data?.accessToken) {
          const newAccessToken = response.data.accessToken;
          localStorage.setItem("accessToken", newAccessToken);

          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Retry original request
          return axiosClient(originalRequest);
        } else {
          // Refresh failed, redirect to login
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Chat/Messenger API methods
export const chatApi = {
  // Send a message to admin
  sendMessage: (data) => axiosClient.post('/api/chat/send', data),
  // Get user's chat messages with admin
  getMessages: (markAsRead = false) => axiosClient.get(`/api/chat/messages/admin?markAsRead=${markAsRead}`),
  // Get unread message count
  getUnreadCount: () => axiosClient.get('/api/chat/unread-count'),
};

// Auth methods
export const authApi = {
  refreshUserToken: (refreshToken) => axiosClient.post('/user/refresh-token', { refreshToken }),
};

export default axiosClient;
