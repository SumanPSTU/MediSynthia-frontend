
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import ChatButton from "./components/ChatButton.jsx";
import Messenger from "./pages/Messenger.jsx";

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
      <div className="flex flex-col min-h-screen">
        <Toaster position="top-right" reverseOrder={false} />
        <Navbar />
        <main className="flex-grow pt-[var(--navbar-height)]">
          <AppRoutes />
        </main>
        <Footer />
        
        {/* Global Chat Components */}
        <ChatButton isOpen={isChatOpen} onClick={() => setIsChatOpen(!isChatOpen)} />
        <Messenger isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    </BrowserRouter>
  );
}

export default App;

