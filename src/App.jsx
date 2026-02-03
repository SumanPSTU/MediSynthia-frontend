
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import ChatButton from "./components/ChatButton.jsx";
import Messenger from "./pages/Messenger.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      const storedUnreadCount = localStorage.getItem("medisynthia_unread_count");
      if (storedUnreadCount !== null) {
        const parsedCount = Number(storedUnreadCount);
        if (!Number.isNaN(parsedCount)) {
          setUnreadCount(parsedCount);
          return;
        }
      }
      const storedUnread = localStorage.getItem("medisynthia_unread_messages");
      if (storedUnread) {
        const parsed = JSON.parse(storedUnread);
        if (Array.isArray(parsed)) {
          setUnreadCount(parsed.length);
        }
      }
    } catch (e) {
      // Silent catch
    }
  }, []);

  return (
    <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
      <div className="flex flex-col min-h-screen">
        <Toaster position="top-right" reverseOrder={false} />
        <ScrollToTop />
        <Navbar />
        <main className="flex-grow pt-[var(--navbar-height)]">
          <AppRoutes />
        </main>
        <Footer />
        
        {/* Global Chat Components */}
        <ChatButton 
          isOpen={isChatOpen} 
          onClick={() => {
            setIsChatOpen(!isChatOpen);
            if (!isChatOpen) {
              setUnreadCount(0); // Clear unread when opening chat
            }
          }} 
          unreadCount={unreadCount}
        />
        <Messenger 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)}
          onNewMessage={(count) => setUnreadCount(count)}
          onChatOpen={() => setUnreadCount(0)}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;

