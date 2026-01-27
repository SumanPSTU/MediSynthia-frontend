import { useState, useEffect, useRef } from "react";
import { Send, X, User, RefreshCw, MessageCircle, WifiOff, CheckCheck } from "lucide-react";

const STORAGE_KEY = "medisynthia_chat_messages";

export default function Messenger({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [adminId] = useState("admin");
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
        console.error("Error parsing stored messages:", e);
      }
    }
    
    const storedQueue = localStorage.getItem("medisynthia_offline_queue");
    if (storedQueue) {
      try {
        setOfflineQueue(JSON.parse(storedQueue));
      } catch (e) {
        console.error("Error parsing offline queue:", e);
      }
    }

    // Get user ID
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
      const guestId = "user_" + Math.random().toString(36).substr(2, 9);
      setUserId(guestId);
    } catch (error) {
      const guestId = "user_" + Math.random().toString(36).substr(2, 9);
      setUserId(guestId);
    }
  }, [token]);

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

  // Try to connect to socket (optional - works without it)
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    console.log("Initializing socket connection...");
    setConnectionError(null);

    try {
      const BACKEND_URL = "http://localhost:3000";
      
      // Dynamic import to avoid issues if socket.io-client not installed
      import("socket.io-client").then(({ io }) => {
        const newSocket = io(BACKEND_URL, {
          transports: ["polling", "websocket"],
          reconnection: true,
          reconnectionAttempts: 2,
          reconnectionDelay: 3000,
          timeout: 10000,
          forceNew: true,
        });

        newSocket.on("connect", () => {
          console.log("✓ Socket connected!");
          setIsConnected(true);
          setConnectionError(null);
          setRetryCount(0);
          
          if (userId) {
            newSocket.emit("joinUser", userId);
          }
          
          // Send queued messages
          if (offlineQueue.length > 0) {
            sendQueuedMessages(newSocket);
          }
        });

        newSocket.on("connect_error", (err) => {
          console.log("Socket connection failed (this is OK - chat works offline)");
          setIsConnected(false);
        });

        newSocket.on("disconnect", () => {
          setIsConnected(false);
        });

        newSocket.on("receiveDirectMessage", (message) => {
          setMessages(prev => {
            if (prev.find((m) => m._id === message._id)) return prev;
            return [...prev, message];
          });
        });

        newSocket.on("messageSent", (message) => {
          setSending(false);
          setMessages(prev => {
            if (prev.find((m) => m._id === message._id)) return prev;
            return [...prev, message];
          });
        });

        setSocket(newSocket);
      }).catch(err => {
        console.log("socket.io-client not available, working in offline mode");
        setIsConnected(false);
      });
    } catch (err) {
      console.log("Working in offline mode");
      setIsConnected(false);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isOpen, userId]);

  // Send queued messages when connected
  const sendQueuedMessages = (sock) => {
    if (!sock || offlineQueue.length === 0) return;
    
    console.log(`Sending ${offlineQueue.length} queued messages...`);
    
    offlineQueue.forEach((msg, index) => {
      setTimeout(() => {
        sock.emit("sendDirectMessage", msg);
      }, index * 500);
    });
    
    setTimeout(() => {
      setOfflineQueue([]);
      localStorage.removeItem("medisynthia_offline_queue");
    }, offlineQueue.length * 500 + 500);
  };

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
      window.location.reload();
    }, 500);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    
    const messageText = newMessage.trim();
    if (!messageText || !userId) return;

    const messageData = {
      senderId: userId,
      receiverId: adminId,
      message: messageText,
      senderType: "user",
    };

    console.log("Sending message:", messageText);

    if (isConnected && socket) {
      setSending(true);
      socket.emit("sendDirectMessage", messageData);
    } else {
      // Queue message for later
      setOfflineQueue(prev => [...prev, messageData]);
    }

    // Add temporary message for immediate feedback
    const tempMsg = {
      _id: "temp_" + Date.now(),
      ...messageData,
      timestamp: new Date().toISOString(),
      queued: !isConnected
    };
    setMessages(prev => [...prev, tempMsg]);

    setNewMessage("");
  };

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
            <div>
              <h3 className="text-white font-semibold text-lg">Support Team</h3>
              <p className="text-emerald-100 text-xs flex items-center gap-1">
                {isConnected ? (
                  <>Online • Fast response</>
                ) : (
                  <span className="flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> Offline mode
                  </span>
                )}
              </p>
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
                className="p-2 hover:bg-white/20 rounded-lg text-emerald-100 transition"
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
        
        {/* Stats bar */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-emerald-500/30">
          <div className="flex items-center gap-1">
            <span className="text-emerald-100 text-xs">Messages:</span>
            <span className="text-white text-sm font-medium">{totalMessages}</span>
          </div>
          {queuedCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-emerald-100 text-xs">Queued:</span>
              <span className="text-yellow-300 text-sm font-medium">{queuedCount}</span>
            </div>
          )}
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
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-700 text-xs font-medium mb-2">💡 Chat works offline</p>
                <p className="text-blue-600 text-xs">
                  Messages are saved locally and sent when the server is available
                </p>
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
                            : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-br-sm shadow-lg"
                          : "bg-white text-gray-800 rounded-bl-sm shadow-lg border border-gray-100"
                      }`}>
                        {msg.message && <p className="text-sm leading-relaxed">{msg.message}</p>}
                        
                        <div className={`flex items-center gap-1.5 mt-1.5 ${isUser ? "justify-end" : "justify-start"}`}>
                          <span className={`text-xs ${isUser ? (isQueued ? "text-gray-200" : "text-emerald-100") : "text-gray-400"}`}>
                            {formatTime(msg.timestamp)}
                          </span>
                          {isUser && (
                            <span className={`text-xs ${isQueued ? "text-gray-200" : "text-emerald-200"}`}>
                              {isQueued ? "⏳" : <CheckCheck className="w-3 h-3" />}
                            </span>
                          )}
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
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`p-3 rounded-full transition-all duration-300 ${
              newMessage.trim() && !sending
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg"
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
        {!isConnected && queuedCount > 0 && (
          <p className="text-xs text-blue-600 mt-2 text-center">
            📤 {queuedCount} message{queuedCount > 1 ? "s" : ""} queued - will send when server is available
          </p>
        )}
      </form>
    </div>
  );
}
