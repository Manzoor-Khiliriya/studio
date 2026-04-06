import React from "react";
import { useLocation, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

// Components
import Navbar from "./Navbar";
import Footer from "./Footer";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return (
      <main className="min-h-screen bg-[#fdfdfd]">
        {children || <Outlet />}
      </main>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#fdfdfd] text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900 overflow-hidden">
      
      <div className="z-50">
        <Navbar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="h-[calc(100vh-7vh)] overflow-y-auto border-r border-orange-100 z-30 bg-white">
          <Sidebar />
        </aside>

        <div className="flex-1 flex flex-col min-w-0 bg-orange-50/20 relative overflow-y-auto custom-scrollbar">
          
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

          <main className="flex-1  z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.99 }}
                transition={{ 
                  duration: 0.35, 
                  ease: [0.22, 1, 0.36, 1] 
                }}
                className="mx-auto w-full"
              >
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