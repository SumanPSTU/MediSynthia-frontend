import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export default function ChatButton({ isOpen, onClick, unreadCount = 0 }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPulse, setShowPulse] = useState(!isOpen);

  // WhatsApp contact number - Bangladesh format
  const WHATSAPP_NUMBER = "8801714153444"; // Replace with actual number without '+' or dashes
  const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hello there! I need assistance with my order on MediSynthia.`;

  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    window.open(WHATSAPP_URL, "_blank");
  };

  useEffect(() => {
    setShowPulse(!isOpen);
  }, [isOpen]);

  return (
    <>
      {/* Main Chat Button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed bottom-6 right-6 z-50 group transition-all duration-300 ${
          isOpen ? "scale-90" : "hover:scale-105 active:scale-95"
        }`}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {/* Animated pulse ring */}
        {showPulse && (
          <>
            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20"></div>
            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-10" style={{ animationDelay: "0.5s" }}></div>
          </>
        )}
        
        {/* Main button */}
        <div
          className={`relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30"
              : "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/40 hover:shadow-emerald-500/60"
          }`}
        >
          {/* WhatsApp Icon - appears on hover, positioned above */}
          {isHovered && !isOpen && (
            <div 
              className="group/whatsapp absolute -top-16 left-1/2 -translate-x-1/2"
              onClick={handleWhatsAppClick}
              title="Chat on WhatsApp"
            >
              <FaWhatsapp className="w-16 h-14 text-green-500 hover:text-green-600 cursor-pointer" />
              
              {/* WhatsApp Tooltip - Left side like main tooltip */}
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-900 text-white text-xs rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover/whatsapp:opacity-100 pointer-events-none">
                <span className="font-medium">Chat through WhatsApp</span>
                <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-gray-900"></div>
              </div>
            </div>
          )}

          {/* Icon */}
          <div className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}>
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <div className="relative">
                <MessageCircle className="w-7 h-7 text-white" />
                {/* Unread message count badge */}
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 rounded-full shadow-lg flex items-center justify-center animate-bounce">
                    <span className="text-white text-xs font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hover tooltip */}
          <div
            className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-900 text-white text-sm rounded-xl shadow-xl whitespace-nowrap transition-all duration-300 ${
              isHovered && !isOpen 
                ? "opacity-100 translate-x-0" 
                : "opacity-0 translate-x-2 pointer-events-none"
            }`}
          >
            <span className="font-medium">Need help?</span>
            <span className="text-gray-300 ml-1">Chat with us</span>
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-gray-900"></div>
          </div>
        </div>
      </button>
    </>
  );
}

