import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../services/authApi";
import { setCredentials } from "../features/auth/authSlice";
import { motion } from "framer-motion";
import { 
  HiOutlineMail, 
  HiOutlineLockClosed, 
  HiArrowRight, 
  HiOutlineEye, 
  HiOutlineEyeOff 
} from "react-icons/hi";
import { RiShieldFlashLine } from "react-icons/ri";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // New state for visibility
  const [focused, setFocused] = useState(null);

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const loginPromise = login({
      email: email.trim().toLowerCase(),
      password,
    }).unwrap();

    toast.promise(loginPromise, {
      loading: "Signing you in...",
      success: "Welcome back!",
      error: (err) => err?.data?.message || "Invalid credentials",
    });

    try {
      const userData = await loginPromise;
      dispatch(setCredentials({ ...userData }));
      setTimeout(() => {
        navigate(userData.user.role === "Admin" ? "/admin" : "/employee");
      }, 800);
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-orange-100">
      
      {/* --- LEFT SIDE: BRAND PERSPECTIVE --- */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center p-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <RiShieldFlashLine size={28} />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">WorkFlow</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl font-semibold text-white leading-tight mb-6"
          >
            Manage your work <br />
            <span className="text-orange-500">with precision.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg leading-relaxed mb-10"
          >
            The all-in-one platform for workforce orchestration, 
            real-time reporting, and seamless task management.
          </motion.p>
        </div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h2>
            <p className="text-slate-500 text-sm">Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <HiOutlineMail 
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'email' ? 'text-orange-500' : 'text-slate-400'}`} 
                  size={20} 
                />
                <input
                  type="email"
                  required
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-4 outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-slate-800"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <button 
                  type="button" 
                  onClick={() => navigate("/reset-password")}
                  className="text-xs font-medium text-orange-400 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <HiOutlineLockClosed 
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'password' ? 'text-orange-500' : 'text-slate-400'}`} 
                  size={20} 
                />
                <input
                  type={showPassword ? "text" : "password"} // Dynamic type
                  required
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-4 outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-slate-800"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {/* Visibility Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                </button>
              </div>
            </div>

            {/* SUBMIT */}
            <button
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
                isLoading 
                ? "bg-slate-300 cursor-not-allowed" 
                : "bg-orange-500 hover:bg-orange-600 active:scale-[0.98] shadow-slate-200  cursor-pointer"
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <HiArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}