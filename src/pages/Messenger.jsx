
import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { Send, X, User, RefreshCw, MessageCircle, Wifi } from "lucide-react";
import { chatApi } from "../api/axiosClient";
import { toast } from "react-hot-toast";

const STORAGE_KEY = "medisynthia_chat_messages";

export default function Messenger({ isOpen, onClose, onNewMessage, onChatOpen }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [adminId, setAdminId] = useState("admin");
  const [isConnected, setIsConnected] = useState(false);
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const [sending, setSending] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const shownToastIdsRef = useRef(new Set());
  const hasLoadedUnreadRef = useRef(false);
  const initialUnreadCountRef = useRef(null);
  const onChatOpenRef = useRef(onChatOpen);
  const onNewMessageRef = useRef(onNewMessage);
  const token = localStorage.getItem("accessToken");

  // Clear messages when user logs out
  useEffect(() => {
    if (!token) {
      setMessages([]);
      setUnreadMessages([]);
      setOfflineQueue([]);
      setIsLoadingHistory(false);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("medisynthia_unread_messages");
      localStorage.removeItem("medisynthia_unread_count");
      localStorage.removeItem("medisynthia_offline_queue");
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [token, socket]);

  // Update refs when props change
  useEffect(() => {
    onChatOpenRef.current = onChatOpen;
    onNewMessageRef.current = onNewMessage;
  }, [onChatOpen, onNewMessage]);

  // Load messages from localStorage
  useEffect(() => {
    const storedMessages = localStorage.getItem(STORAGE_KEY);
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        setMessages(parsed);
      } catch (e) { }
    }

    const storedQueue = localStorage.getItem("medisynthia_offline_queue");
    if (storedQueue) {
      try {
        setOfflineQueue(JSON.parse(storedQueue));
      } catch (e) { }
    }

    const storedUnreadCount = localStorage.getItem("medisynthia_unread_count");
    if (storedUnreadCount !== null) {
      const parsedCount = Number(storedUnreadCount);
      if (!Number.isNaN(parsedCount)) {
        initialUnreadCountRef.current = parsedCount;
        if (onNewMessageRef.current && !isOpen && parsedCount > 0) {
          onNewMessageRef.current(parsedCount);
        }
      }
    }
    const storedUnread = localStorage.getItem("medisynthia_unread_messages");
    if (storedUnread) {
      try {
        const parsed = JSON.parse(storedUnread);
        setUnreadMessages(parsed);
        if (onNewMessageRef.current && !isOpen) {
          onNewMessageRef.current(parsed.length);
        }
      } catch (e) { }
      finally {
        hasLoadedUnreadRef.current = true;
      }
    } else {
      hasLoadedUnreadRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (offlineQueue.length > 0) {
      localStorage.setItem("medisynthia_offline_queue", JSON.stringify(offlineQueue));
    }
  }, [offlineQueue]);

  useEffect(() => {
    if (!hasLoadedUnreadRef.current) return;
    localStorage.setItem("medisynthia_unread_messages", JSON.stringify(unreadMessages));
    if (unreadMessages.length > 0) {
      localStorage.setItem("medisynthia_unread_count", String(unreadMessages.length));
      initialUnreadCountRef.current = unreadMessages.length;
    }
  }, [unreadMessages]);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!isOpen || !token) return;

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
      setRetryCount(0);

      if (userId) {
        newSocket.emit("joinUser", userId);
        newSocket.emit("checkAdminStatus");
      }

      sendQueuedMessages(newSocket);
    });

    newSocket.on("connect_error", (err) => {
      setIsConnected(false);
    });

    newSocket.on("connect_timeout", () => {
    });

    newSocket.on("disconnect", (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") {
      }
    });

    newSocket.on("error", (error) => {
    });

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
        // No guest ID - user must be logged in to use messenger
        setUserId("");
      } catch (error) {
        setUserId("");
      }
    };

    const getAdminId = async () => {
      try {
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
        setAdminId("admin");
      } catch (error) {
        setAdminId("admin");
      }
    };

    getUserId();
    getAdminId();

    const handleReceiveMessage = (message) => {
      let isAlreadyInMessages = false;

      setMessages((prev) => {
        if (prev.find((m) => m._id === message._id)) {
          isAlreadyInMessages = true;
          return prev;
        }
        const filtered = prev.filter(m =>
          !(m.message === message.message &&
            m.senderId === message.senderId &&
            m._id.toString().startsWith('temp_'))
        );
        return [...filtered, message];
      });

      if (isAlreadyInMessages) return;

      const isFromAdmin = message.senderType === "admin" ||
        (message.senderType !== "user" && message.senderId !== userId);

      if (isFromAdmin) {
        if (shownToastIdsRef.current.has(message._id)) return;

        shownToastIdsRef.current.add(message._id);

        setUnreadMessages(prev => {
          if (prev.includes(message._id)) return prev;
          return [...prev, message._id];
        });

        toast((t) => (
          <div onClick={() => {
            toast.dismiss(t.id);
            if (onChatOpenRef.current) onChatOpenRef.current();
          }} className="cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">New message from Support</p>
                <p className="text-sm text-gray-600 mt-1">{message.message?.substring(0, 50)}{message.message?.length > 50 ? '...' : ''}</p>
              </div>
            </div>
          </div>
        ), {
          duration: 5000,
          icon: '💬',
        });
      }
    };

    const handleMessageSent = (message) => {
      setSending(false);
      setMessages((prev) => {
        const filtered = prev.filter(m =>
          !(m.message === message.message &&
            m.senderId === message.senderId &&
            m.senderType === message.senderType &&
            m._id.toString().startsWith('temp_'))
        );
        if (filtered.find((m) => m._id === message._id)) {
          return filtered;
        }
        return [...filtered, message];
      });
    };

    newSocket.on("receiveDirectMessage", handleReceiveMessage);
    newSocket.on("messageSent", handleMessageSent);

    newSocket.on("adminOnline", () => {
      setIsAdminOnline(true);
    });

    newSocket.on("adminOffline", () => {
      setIsAdminOnline(false);
    });

    newSocket.on("adminStatus", (status) => {
      setIsAdminOnline(status?.isOnline || false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off("receiveDirectMessage", handleReceiveMessage);
      newSocket.off("messageSent", handleMessageSent);
      newSocket.off("adminOnline");
      newSocket.off("adminOffline");
      newSocket.off("adminStatus");
      if (newSocket && newSocket.connected) {
        newSocket.disconnect();
      }
    };
  }, [isOpen, token, userId]);

  const loadPreviousMessages = useCallback(async () => {
    if (!token || !userId) return;
    setIsLoadingHistory(true);
    try {
      // Pass markAsRead=true only when chat is open, false when just checking for unread
      const response = await chatApi.getMessages(isOpen);
      const apiMessages = response?.data?.messages;
      if (Array.isArray(apiMessages)) {
        // Find unread messages from admin (only messages explicitly marked as unread)
        const unreadFromAdmin = apiMessages
          .filter(m => {
            const isFromAdmin = m.senderType === "admin" || m.senderId !== userId;
            // Only count as unread if explicitly set to false (not undefined)
            return isFromAdmin && m.read === false;
          })
          .map(m => m._id);

        // Update unread state if chat is not open
        if (!isOpen && unreadFromAdmin.length > 0) {
          setUnreadMessages(unreadFromAdmin);
          localStorage.setItem("medisynthia_unread_messages", JSON.stringify(unreadFromAdmin));
          localStorage.setItem("medisynthia_unread_count", String(unreadFromAdmin.length));
          if (onNewMessageRef.current) {
            onNewMessageRef.current(unreadFromAdmin.length);
          }
        } else if (isOpen) {
          // If chat is already open when loading, don't show unread
          setUnreadMessages([]);
        }

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const normalized = apiMessages
            .map((m) => ({
              ...m,
              senderType: m.senderType || (m.senderId === userId ? "user" : "admin"),
              timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
            }))
            .filter((m) => !existingIds.has(m._id));
          if (normalized.length === 0) return prev;
          return [...prev, ...normalized].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
      }
    } catch (error) {
      // Silent fail to avoid blocking chat UI
    } finally {
      setIsLoadingHistory(false);
    }
  }, [token, userId, isOpen]);

  const sendQueuedMessages = useCallback((socket) => {
    if (!socket || offlineQueue.length === 0) return;

    offlineQueue.forEach((msg, index) => {
      setTimeout(() => {
        socket.emit("sendDirectMessage", msg);
      }, index * 500);
    });

    setTimeout(() => {
      setOfflineQueue([]);
      localStorage.removeItem("medisynthia_offline_queue");
    }, offlineQueue.length * 500 + 500);
  }, [offlineQueue]);

  useEffect(() => {
    if (isOpen) {
      initializeSocket();
      // Clear unread state immediately when opening chat
      setUnreadMessages([]);
      localStorage.removeItem("medisynthia_unread_messages");
      localStorage.removeItem("medisynthia_unread_count");
      if (onNewMessageRef.current) {
        onNewMessageRef.current(0);
      }
    }
  }, [isOpen, initializeSocket]);

  // Load previous messages once userId is available
  useEffect(() => {
    if (userId && !isOpen) {
      // Load messages on login to check for unread
      loadPreviousMessages();
    } else if (isOpen && userId) {
      loadPreviousMessages();
    }
  }, [isOpen, userId, loadPreviousMessages]);

  useEffect(() => {
    if (!hasLoadedUnreadRef.current) return;
    if (!isOpen && unreadMessages.length === 0 && (initialUnreadCountRef.current || 0) > 0) {
      return;
    }
    if (onNewMessageRef.current && !isOpen) {
      onNewMessageRef.current(unreadMessages.length);
    }
  }, [unreadMessages, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

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
      setSending(true);
      socket.emit("sendDirectMessage", messageData);
    } else {
      setOfflineQueue(prev => [...prev, messageData]);
    }

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

  if (!isOpen) return null;

  // Show login prompt if not authenticated
  if (!token || !userId) {
    return (
      <div className="fixed bottom-24 right-6 w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200 animate-slide-up">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Support Team</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h4 className="text-gray-800 font-semibold text-lg mb-2">Login Required</h4>
            <p className="text-gray-600 text-sm mb-4">Please login to chat with our support team</p>
            <button
              onClick={() => {
                onClose();
                window.location.href = '/login';
              }}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full hover:shadow-lg transition"
            >
              Login Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200 animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-3 border-emerald-500 ${isAdminOnline ? "bg-green-400 animate-pulse" : "bg-green-400"
                }`}></div>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Support Team</h3>
              <p className="text-emerald-100 text-xs flex items-center gap-1">
                {isAdminOnline ? (
                  <>Online</>
                ) : (
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Online
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

            {isLoadingHistory && (
              <p className="text-gray-400 text-xs">Loading previous messages...</p>
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
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                            <User className="w-4 h-4 text-white" />
                          </div>

                          <span className="text-xs text-gray-400 leading-none">
                            Support team
                          </span>
                        </div>
                      )}

                      <div className={`relative rounded-2xl px-4 py-3 ${isUser
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
            className={`p-3 rounded-full transition-all duration-300 ${newMessage.trim()
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
      </form>
    </div>
  );
}

