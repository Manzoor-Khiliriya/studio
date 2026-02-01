import Navbar from "./Navbar";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux"; // Added to check auth state

export default function Layout({ children }) {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth); // Access Redux User

  // If there's no user, we might not want to show the Sidebar/Navbar 
  // though usually, ProtectedRoutes handles this redirection first.
  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfd]">
      {/* Top Navigation - Shared across all roles */}
      <Navbar />

      <div className="flex flex-1">
        {/* Left Sidebar - Role-based links inside */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-orange-50/20">
          <main className="flex-1 p-4 md:p-8 lg:p-10 pb-28 md:pb-10">
            {/* Page Transition Wrapper */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="max-w-7xl mx-auto w-full" // Added container for better spacing
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Footer inside the content area */}
          <Footer />
        </div>
      </div>
    </div>
  );
}