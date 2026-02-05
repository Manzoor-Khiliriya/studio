import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../services/authApi";
import { setCredentials } from "../features/auth/authSlice";
import { motion } from "framer-motion";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineArrowRight } from "react-icons/hi";
import { RiShieldFlashLine } from "react-icons/ri";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      loading: "Verifying credentials...",
      success: "Access Granted. Welcome back.",
      error: (err) => err?.data?.message || "Authentication Failed",
    });

    try {
      const userData = await loginPromise;
      dispatch(setCredentials({ ...userData }));

      // Strategic delay to allow the success toast to be seen
      setTimeout(() => {
        navigate(userData.user.role === "Admin" ? "/admin" : "/employee");
      }, 1000);
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-orange-100 overflow-hidden">
      
      {/* --- LEFT SIDE: THE COMMAND BRIDGE (BRANDING) --- */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[55%] bg-[#0a0c10] relative items-center justify-center p-24 overflow-hidden"
      >
        {/* Abstract Kinetic Background */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              rotate: [0, 45, 0]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-gradient-to-br from-orange-600/20 via-transparent to-transparent rounded-full blur-[120px]"
          />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-16 h-16 bg-orange-600 rounded-[2rem] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(234,88,12,0.3)]">
              <RiShieldFlashLine size={36} />
            </div>
            <span className="text-white text-4xl font-black tracking-tighter uppercase italic">WorkFlow.io</span>
          </div>

          <h1 className="text-8xl font-black text-white leading-[0.9] tracking-tighter mb-10 italic">
            ENGINEERED <br /> 
            FOR <span className="text-orange-500 underline decoration-orange-500/20">SPEED.</span>
          </h1>
          
          <div className="space-y-6 border-l-2 border-slate-800 pl-8">
            <p className="text-slate-400 text-lg font-bold uppercase tracking-widest leading-relaxed">
              Internal Command Center v3.0
            </p>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm">
              Global workforce orchestration, real-time telemetry, and high-fidelity task distribution.
            </p>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="absolute bottom-12 left-24 flex gap-8">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Status: Ready</div>
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Node: 01-Primary</div>
        </div>
      </motion.div>

      {/* --- RIGHT SIDE: THE ACCESS TERMINAL (LOGIN) --- */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-12 md:p-24 bg-white relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-16 text-center lg:text-left">
            <h2 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">Login</h2>
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Identity Verification Required</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-10">
            {/* EMAIL INPUT */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-400 ml-2">Secure Email</label>
              <div className={`group relative transition-all duration-500 ${focused === 'email' ? 'translate-x-2' : ''}`}>
                <HiOutlineMail className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors duration-500 ${focused === 'email' ? 'text-orange-600' : 'text-slate-300'}`} size={24} />
                <input
                  type="email"
                  required
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] pl-16 pr-8 py-6 outline-none focus:bg-white focus:border-orange-500/20 focus:ring-[12px] focus:ring-orange-500/5 transition-all font-bold text-slate-800 placeholder:text-slate-200"
                  placeholder="operator@workflow.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-3">
              <div className="flex justify-between items-end px-2">
                <label className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-400">Security Key</label>
                <button type="button" className="text-[9px] font-black uppercase text-slate-300 hover:text-orange-600 transition-colors tracking-widest">Forgot Passcode?</button>
              </div>
              <div className={`group relative transition-all duration-500 ${focused === 'password' ? 'translate-x-2' : ''}`}>
                <HiOutlineLockClosed className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors duration-500 ${focused === 'password' ? 'text-orange-600' : 'text-slate-300'}`} size={24} />
                <input
                  type="password"
                  required
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] pl-16 pr-8 py-6 outline-none focus:bg-white focus:border-orange-500/20 focus:ring-[12px] focus:ring-orange-500/5 transition-all font-bold text-slate-800 placeholder:text-slate-200"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* SUBMIT ACTION */}
            <motion.button
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className={`w-full py-7 rounded-[2.5rem] font-black text-white text-[11px] uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4 relative overflow-hidden group ${
                isLoading 
                ? "bg-slate-200 cursor-not-allowed" 
                : "bg-slate-900 hover:bg-orange-600 shadow-orange-500/20 border-b-4 border-slate-950 active:border-b-0"
              }`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <>
                  Establish Connection <HiOutlineArrowRight size={20} className="group-hover:translate-x-2 transition-transform stroke-[3]" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer Legal/Meta */}
          <p className="mt-16 text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-loose">
            By accessing this terminal, you agree to the <br /> 
            <span className="text-slate-400 hover:text-orange-500 cursor-pointer transition-colors">Internal Security Protocols</span> & <span className="text-slate-400 hover:text-orange-500 cursor-pointer transition-colors">Usage Logs</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}