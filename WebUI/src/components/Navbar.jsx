import { useState, useRef } from "react";
import { useSelector } from "react-redux"; // Added
import { useGlobalSearchQuery } from "../services/searchApi"; // Added
import { FiBell, FiSearch, FiCheckCircle, FiAlertCircle, FiMessageSquare } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useOnClickOutside } from "../hooks/useOnClickOutside";
import logo from "../assets/logo.png";

export default function Navbar() {
  // 1. Get user from Redux
  const { user } = useSelector((state) => state.auth);
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // State for search
  const notificationRef = useRef();

  // 2. Optional: Hook up the global search query
  // skips if searchTerm is less than 3 chars to save server load
  const { data: searchResults, isFetching } = useGlobalSearchQuery(searchTerm, {
    skip: searchTerm.length < 3,
  });

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'task', text: "New task assigned: 'API Integration'", time: "2m ago", read: false },
    { id: 2, type: 'status', text: "Project 'Design Sprint' was completed", time: "1h ago", read: false },
    { id: 3, type: 'comment', text: "Admin left a note on your task", time: "3h ago", read: true },
  ]);

  useOnClickOutside(notificationRef, () => setIsOpen(false));

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.read).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <header className="h-20 flex items-center justify-between px-6 md:px-12 bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-orange-100">

      {/* Left: Greeting */}
      <div className="flex items-center gap-6">
        <img src={logo} alt="logo" className="h-10 w-auto" />
        <div className="hidden lg:block border-l border-orange-100 pl-6">
          <h2 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] leading-none mb-1">
            {greeting}
          </h2>
          <p className="text-xl font-black text-slate-900">
            {user.name.split(" ")[0]}! 🍊
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        
        {/* Search - Connected to RTK Query */}
        <div className="hidden md:relative md:block">
          <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isFetching ? 'text-orange-500' : 'text-slate-400'}`} />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-orange-50/50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 rounded-full py-2 pl-10 pr-4 text-sm transition-all outline-none border border-orange-50"
          />
          
          {/* Subtle search result dropdown could go here */}
        </div>

        {/* Notification Wrapper */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2.5 rounded-xl transition-all border relative ${
              isOpen 
                ? 'bg-orange-100 border-orange-200 text-orange-600 shadow-inner' 
                : 'bg-white border-slate-100 text-slate-500 hover:border-orange-200 hover:bg-orange-50/30 shadow-sm'
            }`}
          >
            <FiBell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full"></span>
            )}
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl shadow-orange-900/10 border border-orange-50 overflow-hidden"
              >
                <div className="p-6 border-b border-orange-50 flex justify-between items-center bg-orange-50/30">
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Notifications</h3>
                  <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadCount} NEW
                  </span>
                </div>

                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-4 flex gap-4 hover:bg-orange-50/50 transition-colors cursor-pointer border-b border-orange-50/50 ${!n.read ? 'bg-orange-50/20' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center 
                        ${n.type === 'task' ? 'bg-orange-100 text-orange-600' :
                          n.type === 'status' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {n.type === 'task' ? <FiAlertCircle /> : n.type === 'status' ? <FiCheckCircle /> : <FiMessageSquare />}
                      </div>
                      <div className="space-y-0.5">
                        <p className={`text-sm leading-snug ${n.read ? 'text-slate-500' : 'font-bold text-slate-800'}`}>{n.text}</p>
                        <p className="text-[10px] text-orange-400 font-bold uppercase">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-100/50 transition-colors border-t border-orange-50">
                  View All Activity
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-600 border-2 border-white shadow-lg shadow-orange-600/20 flex items-center justify-center text-white font-bold shrink-0 cursor-pointer">
            {user.name.charAt(0)}
          </div>
        </div>

      </div>
    </header>
  );
}