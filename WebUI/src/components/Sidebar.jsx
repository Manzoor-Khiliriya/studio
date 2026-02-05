import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import { logOut } from "../features/auth/authSlice"; // Ensure this path is correct
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineSquares2X2,
  HiOutlineUsers,
  HiOutlineQueueList,
  HiOutlineDocumentChartBar,
  HiOutlineViewColumns,
  HiOutlineChevronRight,
  HiOutlineFlag
} from "react-icons/hi2";
import { FiMenu } from "react-icons/fi";
import { HiLogout, HiOutlineCalendar } from "react-icons/hi";

export default function Sidebar() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle Logout via Redux and redirect
  const handleLogout = () => {
    dispatch(logOut());
    // Note: If your authSlice handles window.location.href, navigate is redundant
    // but good for safety.
    navigate("/login");
  };

  if (!user) return null;

  const adminLinks = [
    { to: "/admin", label: "Dashboard", icon: <HiOutlineSquares2X2 /> },
    { to: "/employees", label: "Team Space", icon: <HiOutlineUsers /> },
    { to: "/tasks", label: "Tasks", icon: <HiOutlineQueueList /> },
    { to: '/leaves', label: 'Leaves', icon: <HiOutlineCalendar /> },
    { to: '/holidays', label: 'Holidays', icon: <HiOutlineFlag /> },
  ];

  const employeeLinks = [
    { to: "/employee", label: "Overview", icon: <HiOutlineViewColumns /> },
    { to: "/my-tasks", label: "My Tasks", icon: <HiOutlineQueueList /> },
    { to: "/my-reports", label: "Performance", icon: <HiOutlineDocumentChartBar /> },
    { to: '/my-leaves', label: 'Leaves', icon: <HiOutlineCalendar /> },
    { to: '/public-holidays', label: 'Calendar', icon: <HiOutlineFlag /> },
  ];

  const links = user.role === "Admin" ? adminLinks : employeeLinks;

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex w-72 bg-[#0f1115] text-slate-400 min-h-screen flex-col p-6 sticky top-0 border-r border-orange-900/10 z-50">
        
        {/* Brand/App Name (Optional if not in Navbar) */}
        <div className="mb-8 px-4">
           <span className="text-orange-500 font-black tracking-tighter text-2xl">PORTAL.</span>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-1 relative">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `group relative flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
                  isActive ? "text-white" : "hover:text-orange-100 hover:bg-orange-500/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active Background Glow */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-orange-600 rounded-xl shadow-lg shadow-orange-600/20"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <span className={`relative z-10 text-xl transition-colors duration-300 ${
                    isActive ? "text-white" : "text-slate-500 group-hover:text-orange-400"
                  }`}>
                    {link.icon}
                  </span>
                  
                  <span className="relative z-10">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop User Footer */}
        <div className="pt-6 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-3 py-4 mb-4 bg-orange-500/5 rounded-2xl border border-orange-500/10">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black ring-2 ring-[#1a1d23]">
              {user.name?.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-orange-500/70 font-black">{user.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold text-slate-500 hover:text-orange-400 hover:bg-orange-500/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <HiLogout className="text-xl transition-transform group-hover:-translate-x-1" />
              <span>Sign Out</span>
            </div>
            <HiOutlineChevronRight className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
          </button>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-orange-100 px-4 py-2 flex justify-around items-center z-[100] h-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {links.slice(0, 4).map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive ? "text-orange-600" : "text-slate-400"
              }`
            }
          >
            <span className="text-2xl">{link.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest">{link.label}</span>
            {/* Minimal Mobile Indicator */}
            <NavLink to={link.to}>
              {({ isActive }) => isActive && (
                <motion.div layoutId="mobileActive" className="w-1 h-1 rounded-full bg-orange-600 mt-0.5" />
              )}
            </NavLink>
          </NavLink>
        ))}

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 p-2 text-slate-400 active:text-orange-500"
        >
          <FiMenu size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">More</span>
        </button>
      </nav>

      {/* --- MOBILE OVERLAY DRAWER --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[101] md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 z-[102] md:hidden shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />

              <div className="flex items-center gap-5 p-6 bg-orange-50 rounded-[2.5rem] mb-8 border border-orange-100/50">
                <div className="w-16 h-16 rounded-3xl bg-orange-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-orange-200">
                  {user.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-2xl text-slate-900 tracking-tight">{user.name}</h4>
                  <p className="text-[10px] text-orange-600 uppercase font-black tracking-[0.2em]">{user.role} Dashboard</p>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="grid grid-cols-1 gap-3">
                    {/* Secondary links that didn't fit in the 4-item bottom nav could go here */}
                    {links.slice(4).map((link) => (
                      <NavLink 
                        key={link.to} 
                        to={link.to} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 text-slate-600 font-bold"
                      >
                         <span className="text-xl">{link.icon}</span>
                         <span>{link.label}</span>
                      </NavLink>
                    ))}
                 </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-4 py-5 bg-slate-900 text-white font-black rounded-[2rem] transition-all active:scale-95 shadow-2xl shadow-slate-200 mt-4"
                >
                  <HiLogout size={22} className="text-orange-500" /> 
                  <span className="tracking-widest uppercase text-xs">Terminate Session</span>
                </button>
                
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                >
                  Close Menu
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}