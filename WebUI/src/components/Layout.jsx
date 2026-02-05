import React from "react";
import { useLocation, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

// Components
import Navbar from "./Navbar";
import Footer from "./Footer";
import Sidebar from "./Sidebar";

/**
 * Layout Component
 * Provides a consistent structure with Navbar, Sidebar, and animated page transitions.
 * Supports both {children} (manual wrap) and <Outlet /> (nested routes).
 */
export default function Layout({ children }) {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // If session is lost or user is null, just render content without chrome
  // This acts as a safety net if a public page accidentally uses the layout
  if (!user) {
    return (
      <main className="min-h-screen bg-[#fdfdfd]">
        {children || <Outlet />}
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfd] text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* 1. TOP NAVIGATION */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* 2. PERSISTENT SIDEBAR */}
        <Sidebar />

        {/* 3. MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 bg-orange-50/20 relative">
          
          {/* Subtle Background Accent */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

          <main className="flex-1 p-4 md:p-8 lg:p-10 pb-28 md:pb-10 z-10">
            {/* PAGE TRANSITION WRAPPER */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.99 }}
                transition={{ 
                  duration: 0.35, 
                  ease: [0.22, 1, 0.36, 1] // Custom "cubic-bezier" for smoother premium feel
                }}
                className="max-w-7xl mx-auto w-full"
              >
                {/* Dynamic Rendering:
                   If you pass components as children in App.js, they show up here.
                   If you use nested routes in App.js, the <Outlet /> handles it.
                */}
                {children || <Outlet />}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* 4. FOOTER */}
          <Footer />
        </div>
      </div>
    </div>
  );
}