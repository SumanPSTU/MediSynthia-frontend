import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});
 
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Chat/Messenger API methods
export const chatApi = {
  // Send a message to admin
  sendMessage: (data) => axiosClient.post('/api/chat/send', data),
  // Get user's chat messages with admin
  getMessages: () => axiosClient.get('/api/chat/messages/admin'),
  // Get unread message count
  getUnreadCount: () => axiosClient.get('/api/chat/unread-count'),
};

export default axiosClient;
