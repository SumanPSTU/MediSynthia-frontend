
import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { Send, X, User, RefreshCw, MessageCircle, WifiOff } from "lucide-react";
import { chatApi } from "../api/axiosClient";

const STORAGE_KEY = "medisynthia_chat_messages";

export default function Messenger({ isOpen, onClose }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [adminId, setAdminId] = useState("admin");
  const [isConnected, setIsConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");

  // Load messages from localStorage
  useEffect(() => {
    const storedMessages = localStorage.getItem(STORAGE_KEY);
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        setMessages(parsed);
      } catch (e) {
      // Silent catch - localStorage parsing errors handled gracefully
    }
    }
    
    // Load offline queue
    const storedQueue = localStorage.getItem("medisynthia_offline_queue");
    if (storedQueue) {
      try {
        setOfflineQueue(JSON.parse(storedQueue));
      } catch (e) {
      // Silent catch - localStorage parsing errors handled gracefully
    }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Save offline queue
  useEffect(() => {
    if (offlineQueue.length > 0) {
      localStorage.setItem("medisynthia_offline_queue", JSON.stringify(offlineQueue));
    }
  }, [offlineQueue]);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!isOpen) return;

    setConnectionError(null);

    // Use environment variable with fallback to port 8080
    const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

    const newSocket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
      setRetryCount(0);
      
      if (userId) {
        newSocket.emit("joinUser", userId);
      }
      
      // Send any queued messages
      sendQueuedMessages(newSocket);
    });

    newSocket.on("connect_error", (err) => {
      setIsConnected(false);
      setConnectionError("Cannot connect to server. Please check if backend is running.");
    });

    newSocket.on("connect_timeout", () => {
      setConnectionError("Connection timed out. Retrying...");
    });

    newSocket.on("disconnect", (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") {
        setConnectionError("Server disconnected you. Will attempt to reconnect.");
      }
    });

    newSocket.on("error", (error) => {
      setConnectionError("Socket error: " + (error?.message || error));
    });

    // Get user ID from token
    const getUserId = () => {
      try {
        if (token) {
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const id = payload.id || payload._id || payload.userId;
            if (id) {
              setUserId(id);
              return;
            }
          }
        }
        const guestId = "guest_" + Date.now();
        setUserId(guestId);
      } catch (error) {
        const guestId = "guest_" + Date.now();
        setUserId(guestId);
      }
    };

    // Get admin ID from environment or token
    // The admin's ID is stored in the admin's JWT token
    // We need to get it to send messages to the correct admin
    const getAdminId = async () => {
      try {
        // First, try to get admin ID from backend or environment
        // Check if there's a known admin ID in localStorage or environment
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) {
          const parts = adminToken.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const id = payload.id || payload._id || payload.userId;
            if (id) {
              setAdminId(id);
              return;
            }
          }
        }
        
        // Try to fetch admin info from backend
        try {
          const response = await fetch(`${BACKEND_URL}/api/admin/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.admin && data.admin._id) {
              setAdminId(data.admin._id);
              return;
            }
          }
        } catch (e) {
          // Silent catch - will use default admin ID
        }
        
        // Fallback to admin as string (this is the old behavior for backward compatibility)
        // But we also need to keep 'admin' as fallback for existing messages
        setAdminId("admin");
      } catch (error) {
        setAdminId("admin");
      }
    };

    getUserId();
    getAdminId();

    // Listen for messages
    const handleReceiveMessage = (message) => {
      setMessages((prev) => {
        // Check if message already exists by _id
        if (prev.find((m) => m._id === message._id)) {
          return prev;
        }
        // Remove temporary message if it matches this received message
        const filtered = prev.filter(m => 
          !(m.message === message.message && 
            m.senderId === message.senderId && 
            m._id.toString().startsWith('temp_'))
        );
        return [...filtered, message];
      });
    };

    const handleMessageSent = (message) => {
      setSending(false);
      setMessages((prev) => {
        // Remove temporary message with matching content
        const filtered = prev.filter(m => 
          !(m.message === message.message && 
            m.senderId === message.senderId && 
            m.senderType === message.senderType &&
            m._id.toString().startsWith('temp_'))
        );
        // Check if real message already exists
        if (filtered.find((m) => m._id === message._id)) {
          return filtered;
        }
        return [...filtered, message];
      });
    };

    newSocket.on("receiveDirectMessage", handleReceiveMessage);
    newSocket.on("messageSent", handleMessageSent);

    setSocket(newSocket);

    return () => {
      // Remove event listeners to prevent duplicates
      newSocket.off("receiveDirectMessage", handleReceiveMessage);
      newSocket.off("messageSent", handleMessageSent);
      if (newSocket && newSocket.connected) {
        newSocket.disconnect();
      }
    };
  }, [isOpen, token, userId]);

  // Send queued messages when connected
  const sendQueuedMessages = useCallback((socket) => {
    if (!socket || offlineQueue.length === 0) return;
    
    offlineQueue.forEach((msg, index) => {
      setTimeout(() => {
        socket.emit("sendDirectMessage", msg);
      }, index * 500); // Send with delay
    });
    
    // Clear queue after sending
    setTimeout(() => {
      setOfflineQueue([]);
      localStorage.removeItem("medisynthia_offline_queue");
    }, offlineQueue.length * 500 + 500);
  }, [offlineQueue]);

  // Connect when chat opens
  useEffect(() => {
    if (isOpen) {
      initializeSocket();
    }
  }, [isOpen, initializeSocket]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const retryConnection = () => {
    setRetryCount(prev => prev + 1);
    if (socket) {
      socket.disconnect();
    }
    setSocket(null);
    setTimeout(() => {
      initializeSocket();
    }, 200);
  };

  const sendMessage = useCallback((e) => {
    e.preventDefault();
    
    const messageText = newMessage.trim();
    if (!messageText || !userId) return;

    const messageData = {
      senderId: userId,
      receiverId: adminId,
      message: messageText,
      senderType: "user",
    };

    if (isConnected && socket) {
      // Send immediately if connected
      setSending(true);
      socket.emit("sendDirectMessage", messageData);
    } else {
      // Queue message for later
      setOfflineQueue(prev => [...prev, messageData]);
    }

    // Add temporary message for immediate feedback
    const tempId = "temp_" + Date.now();
    const tempMsg = {
      _id: tempId,
      ...messageData,
      timestamp: new Date().toISOString(),
      queued: !isConnected
    };
    setMessages(prev => [...prev, tempMsg]);

    setNewMessage("");
  }, [newMessage, socket, userId, isConnected]);

  const clearChat = () => {
    if (window.confirm("Clear chat history?")) {
      setMessages([]);
      setOfflineQueue([]);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("medisynthia_offline_queue");
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.timestamp);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  const totalMessages = messages.length;
  const sentMessages = messages.filter(m => m.senderType === "user").length;
  const queuedCount = offlineQueue.length;

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200 animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-3 border-emerald-500 ${
                isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"
              }`}></div>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Support Team</h3>
              <p className="text-emerald-100 text-xs flex items-center gap-1">
                {isConnected ? (
                  <>Online • Typically replies instantly</>
                ) : (
                  <span className="flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> Offline
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={retryConnection}
              className="p-2 hover:bg-white/20 rounded-lg text-emerald-100 transition"
              title="Retry connection"
            >
              <RefreshCw className={`w-4 h-4 ${retryCount > 0 ? "animate-spin" : ""}`} />
            </button>
            {messages.length > 0 && (
              <button 
                onClick={clearChat}
                className="p-2 hover:bg-white/20 rounded-lg text-emerald-100 text-xs transition"
              >
                🗑️
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* Stats bar */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-emerald-500/30">
          <div className="flex items-center gap-1">
            <span className="text-emerald-100 text-xs">Messages:</span>
            <span className="text-white text-sm font-medium">{totalMessages}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-emerald-100 text-xs">Queued:</span>
            <span className={`text-sm font-medium ${queuedCount > 0 ? "text-yellow-300" : "text-white"}`}>
              {queuedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-gray-100 chat-scroll">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <MessageCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h4 className="text-gray-800 font-semibold text-lg mb-2">Welcome! 👋</h4>
            <p className="text-gray-500 text-sm mb-4">How can we help you today?</p>
            
            {!isConnected && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-700 text-xs font-medium mb-2">
                  {queuedCount > 0 ? "📤 Messages queued" : "⚠️ Server disconnected"}
                </p>
                {queuedCount > 0 ? (
                  <p className="text-amber-600 text-xs">
                    {queuedCount} message{queuedCount > 1 ? "s" : ""} will be sent when connection is restored
                  </p>
                ) : (
                  <p className="text-amber-600 text-xs">
                    Messages will be sent when connection is restored
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center justify-center my-4">
                <div className="bg-white/80 backdrop-blur px-4 py-1.5 rounded-full shadow-sm border border-gray-200">
                  <span className="text-xs text-gray-500 font-medium">{date}</span>
                </div>
              </div>
              {msgs.map((msg, idx) => {
                const isUser = msg.senderType === "user";
                const isQueued = msg.queued || false;
                
                return (
                  <div
                    key={msg._id || idx}
                    className={`flex mb-2 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
                      {!isUser && (
                        <div className="flex items-end gap-2 mb-1">
                          <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs text-gray-400">Support</span>
                        </div>
                      )}
                      
                      <div className={`relative rounded-2xl px-4 py-3 ${
                        isUser
                          ? isQueued 
                            ? "bg-gray-400 text-white rounded-br-sm"
                            : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-br-sm shadow-lg shadow-emerald-500/20"
                          : "bg-white text-gray-800 rounded-bl-sm shadow-lg border border-gray-100"
                      }`}>
                        {msg.message && <p className="text-sm leading-relaxed">{msg.message}</p>}
                        
                        <div className={`flex items-center gap-2 mt-1.5 ${isUser ? "justify-end" : "justify-start"}`}>
                          <span className={`text-xs ${isUser ? (isQueued ? "text-gray-200" : "text-emerald-100") : "text-gray-400"}`}>
                            {formatTime(msg.timestamp)}
                          </span>
                          {isUser && (
                            <span className={`text-xs ${isQueued ? "text-gray-200" : "text-emerald-200"}`}>
                              {isQueued ? "⏳" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isConnected ? "Type your message..." : "Message (will send when connected)"}
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full transition-all duration-300 ${
              newMessage.trim()
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/30"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        {!isConnected && offlineQueue.length > 0 && (
          <p className="text-xs text-amber-600 mt-2 text-center">
            📤 {offlineQueue.length} message{offlineQueue.length > 1 ? "s" : ""} queued - will send automatically
          </p>
        )}
      </form>
    </div>
  );
}

