import { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useLazyGlobalSearchQuery } from "../services/searchApi";
import { 
  useGetNotificationsQuery, 
  useMarkNotificationsReadMutation 
} from "../services/notificationApi"; 
import { 
  FiBell, FiSearch, FiCheckCircle, FiAlertCircle, 
  FiMessageSquare, FiUser, FiBriefcase, FiCalendar, FiChevronRight, FiInbox 
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useOnClickOutside } from "../hooks/useOnClickOutside";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Navbar() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const notificationRef = useRef();
  const searchRef = useRef();

  // --- API HOOKS ---
  const [triggerSearch, { data: searchResults, isFetching: isSearching }] = useLazyGlobalSearchQuery();
  const { data: notifications = [] } = useGetNotificationsQuery();
  const [markNotificationsRead] = useMarkNotificationsReadMutation();

  // --- HANDLERS ---
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim().length >= 2) {
      triggerSearch(value);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation(); // Prevent closing dropdown prematurely
    try {
      await markNotificationsRead().unwrap();
    } catch (err) {
      console.error("Failed to sync notifications", err);
    }
  };

  // Close panels when clicking outside
  useOnClickOutside(notificationRef, () => setIsOpen(false));
  useOnClickOutside(searchRef, () => setSearchTerm(""));

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.read).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <header className="h-20 flex items-center justify-between px-6 md:px-12 bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-orange-100">

      {/* LEFT: LOGO & GREETING */}
      <div className="flex items-center gap-6">
        <img 
          src={logo} 
          alt="logo" 
          className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={() => navigate(user.role === 'Admin' ? '/admin' : '/employee')} 
        />
        <div className="hidden lg:block border-l border-orange-100 pl-6">
          <h2 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] leading-none mb-1">
            {greeting}
          </h2>
          <p className="text-xl font-black text-slate-900">
            {user.name.split(" ")[0]}! 🍊
          </p>
        </div>
      </div>

      {/* RIGHT: SEARCH, NOTIFICATIONS, PROFILE */}
      <div className="flex items-center gap-4">
        
        {/* GLOBAL SEARCH */}
        <div className="hidden md:relative md:block" ref={searchRef}>
          <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors z-10 ${isSearching ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`} />
          <input 
            type="text" 
            placeholder="Quick search..." 
            value={searchTerm}
            onChange={handleSearch}
            className="bg-orange-50/50 border-transparent focus:bg-white focus:ring-4 focus:ring-orange-500/10 rounded-full py-2 pl-10 pr-4 text-sm transition-all outline-none border border-orange-50 w-48 focus:w-72 font-bold"
          />
          
          <AnimatePresence>
            {searchTerm.length >= 2 && searchResults && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl shadow-orange-900/10 border border-orange-50 overflow-hidden p-2"
              >
                <div className="p-3 text-[10px] font-black text-orange-400 uppercase tracking-widest border-b border-orange-50/50 mb-1">
                  Results ({searchResults.totalCount || 0})
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {searchResults.results?.length > 0 ? (
                    searchResults.results.map((res) => (
                      <div 
                        key={res._id} 
                        onClick={() => {
                          setSearchTerm("");
                          navigate(res.type === 'employee' ? `/employees/${res._id}` : `/tasks/${res._id}`);
                        }}
                        className="group flex items-center gap-3 p-3 hover:bg-orange-50 rounded-2xl cursor-pointer transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                          {res.type === 'employee' ? <FiUser /> : res.type === 'task' ? <FiBriefcase /> : <FiCalendar />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-800 truncate">{res.name || res.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{res.type} • {res.status || 'Active'}</p>
                        </div>
                        <FiChevronRight className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                      No matching missions found
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* NOTIFICATIONS */}
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
              <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full animate-bounce"></span>
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
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Mission Updates</h3>
                  <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadCount} NEW
                  </span>
                </div>

                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n._id || n.id} 
                        onClick={() => {
                          setIsOpen(false);
                          if (n.taskId) navigate(`/tasks/${n.taskId}`);
                        }}
                        className={`p-5 flex gap-4 hover:bg-orange-50/50 transition-colors cursor-pointer border-b border-orange-50/50 ${!n.read ? 'bg-orange-50/10' : ''}`}
                      >
                        <div className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center border
                          ${n.type === 'task' ? 'bg-orange-100 text-orange-600 border-orange-200' :
                            n.type === 'status' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 
                            'bg-amber-100 text-amber-600 border-amber-200'}`}>
                          {n.type === 'task' ? <FiBriefcase /> : n.type === 'status' ? <FiCheckCircle /> : <FiAlertCircle />}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <p className={`text-sm leading-snug break-words ${n.read ? 'text-slate-500' : 'font-black text-slate-800'}`}>
                            {n.message || n.text}
                          </p>
                          <p className="text-[9px] text-orange-400 font-black uppercase tracking-tighter">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center flex flex-col items-center gap-3">
                      <FiInbox className="text-slate-200" size={40} />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inbox Zero</p>
                    </div>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-100 transition-colors border-t border-orange-50"
                  >
                    Mark all as read
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* USER PROFILE AVATAR */}
        <div className="flex items-center gap-3 pl-2 group">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900 leading-none mb-0.5">{user.name}</p>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">{user.role}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-900 border-2 border-white shadow-lg shadow-slate-200 flex items-center justify-center text-white font-black group-hover:bg-orange-600 transition-all cursor-pointer uppercase">
            {user.name?.charAt(0)}
          </div>
        </div>

      </div>
    </header>
  );
}