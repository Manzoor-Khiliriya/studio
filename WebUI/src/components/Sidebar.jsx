import { NavLink, useNavigate } from "react-router-dom"; // Added useNavigate
import { useSelector, useDispatch } from "react-redux"; // Added Redux hooks
import { useState } from "react";
import { logOut } from "../features/auth/authSlice"; // Import logout action
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineSquares2X2,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineQueueList,
  HiOutlineDocumentChartBar,
  HiOutlineViewColumns,
  HiOutlineChevronRight,
  HiOutlineFlag
} from "react-icons/hi2";
import { FiMenu } from "react-icons/fi";
import { HiLogout, HiOutlineCalendar } from "react-icons/hi";

export default function Sidebar() {
  // 1. Get user from Redux instead of Context
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 2. Handle Logout via Redux
  const handleLogout = () => {
    dispatch(logOut());
    navigate("/login");
  };

  if (!user) return null;

  const adminLinks = [
    { to: "/admin", label: "Dashboard", icon: <HiOutlineSquares2X2 /> },
    { to: "/employees", label: "Team Space", icon: <HiOutlineUsers /> },
    { to: "/tasks", label: "Tasks", icon: <HiOutlineQueueList /> },
    { to: '/leaves', label: 'Leaves', icon: <HiOutlineCalendar /> },
    { to: '/holidays', label: 'Holidays', icon: <HiOutlineFlag /> },
    // { to: "/reports", label: "Analytics", icon: <HiOutlineChartBar /> },
  ];

  const employeeLinks = [
    { to: "/employee", label: "Overview", icon: <HiOutlineViewColumns /> },
    { to: "/my-tasks", label: "My Tasks", icon: <HiOutlineQueueList /> },
    { to: "/my-reports", label: "Performance", icon: <HiOutlineDocumentChartBar /> },
    { to: '/my-leaves', label: 'Leaves', icon: <HiOutlineCalendar /> },
    { to: '/public-holidays', label: 'Calendar', icon: <HiOutlineFlag /> }, // Added for Employees
  ];

  const links = user.role === "Admin" ? adminLinks : employeeLinks;

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex w-72 bg-[#0f1115] text-slate-400 min-h-screen flex-col p-6 sticky top-0 border-r border-orange-900/10">

        {/* Navigation */}
        <nav className="flex-1 space-y-1 relative">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `group relative flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${isActive ? "text-white" : "hover:text-orange-100 hover:bg-orange-500/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-orange-600 rounded-xl shadow-md shadow-orange-600/20"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 text-xl ${isActive ? "text-white" : "text-slate-500 group-hover:text-orange-400"}`}>
                    {link.icon}
                  </span>
                  <span className="relative z-10">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="pt-6 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-3 py-4 mb-4 bg-orange-500/5 rounded-2xl border border-orange-500/10">
            <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-black ring-2 ring-[#1a1d23]">
              {user.name?.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-orange-500/70 font-bold">{user.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout} // Updated to use Redux logout
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold text-slate-500 hover:text-orange-400 hover:bg-orange-500/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <HiLogout className="text-xl" />
              <span>Sign Out</span>
            </div>
            <HiOutlineChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-orange-100 px-4 py-2 flex justify-around items-center z-50">
        {links.slice(0, 5).map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? "text-orange-600 bg-orange-50" : "text-slate-400"
              }`
            }
          >
            <span className="text-2xl">{link.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-tighter">{link.label}</span>
          </NavLink>
        ))}

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 p-2 text-slate-400 active:text-orange-500"
        >
          <FiMenu size={24} />
          <span className="text-[10px] font-black uppercase tracking-tighter">More</span>
        </button>
      </nav>

      {/* --- MOBILE OVERLAY DRAWER --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[51] md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 z-[52] md:hidden shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />

              <div className="flex items-center gap-5 p-5 bg-orange-50 rounded-3xl mb-8">
                <div className="w-16 h-16 rounded-2xl bg-orange-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-orange-200">
                  {user.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-2xl text-slate-900 tracking-tight">{user.name}</h4>
                  <p className="text-xs text-orange-600 uppercase font-black tracking-widest">{user.role} Dashboard</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={handleLogout} // Updated to use Redux logout
                  className="w-full flex items-center justify-center gap-4 py-5 bg-orange-600 text-white font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-200"
                >
                  <HiLogout size={22} /> Logout System
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-4 text-slate-400 font-bold"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}