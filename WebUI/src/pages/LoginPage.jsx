import { useState } from "react";
import { useDispatch } from "react-redux"; // Added
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../services/authApi"; // Added
import { setCredentials } from "../features/auth/authSlice"; // Added
import { motion } from "framer-motion";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineArrowRight } from "react-icons/hi";
import { RiShieldFlashLine } from "react-icons/ri";
import { toast, ToastContainer } from "react-toastify";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focused, setFocused] = useState(null);

  // RTK Hooks
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    // Use toast.promise with the RTK Mutation
    const loginPromise = login({
      email: email.trim().toLowerCase(),
      password,
    }).unwrap(); // .unwrap() allows us to catch errors properly in the promise

    toast.promise(loginPromise, {
      pending: "Verifying authentication...",
      success: "Welcome back!",
      error: {
        render({ data }) {
          // RTK Query errors are usually in data.data.message
          return data?.data?.message || "Invalid identity credentials";
        },
      },
    });

    try {
      const userData = await loginPromise;
      
      // Save user & token to Redux Store + LocalStorage
      dispatch(setCredentials({ ...userData }));

      setTimeout(() => {
        navigate(userData.user.role === "Admin" ? "/admin" : "/employee");
      }, 800);
    } catch (err) {
      // Errors are handled by toast.promise render above
      console.error("Login Error:", err);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-orange-100">
      <ToastContainer position="top-right" autoClose={1500} />

      {/* --- LEFT SIDE: BRANDING --- */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex lg:w-1/2 bg-[#0f1115] relative items-center justify-center p-16 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, 50, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-orange-600 rounded-full blur-[140px]"
          />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-orange-500/40">
              <RiShieldFlashLine size={32} />
            </div>
            <span className="text-white text-3xl font-black tracking-tighter uppercase italic">WorkFlow.io</span>
          </div>

          <h1 className="text-7xl font-black text-white leading-[1] tracking-tight mb-8">
            Fuel your team's <span className="text-orange-500">velocity.</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium leading-relaxed mb-12">
            The high-performance engine for internal task distribution and productivity analytics.
          </p>
        </div>
      </motion.div>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-24 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-14 text-center lg:text-left">
            <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">Identity Check</h2>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Secure Personnel Access Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 ml-1">Company Email</label>
              <div className={`relative transition-all duration-300 ${focused === 'email' ? 'scale-[1.02]' : ''}`}>
                <HiOutlineMail className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${focused === 'email' ? 'text-orange-600' : 'text-slate-400'}`} size={24} />
                <input
                  type="email"
                  required
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl pl-14 pr-6 py-5 outline-none focus:bg-white focus:border-orange-600 focus:ring-8 focus:ring-orange-500/5 transition-all font-bold text-slate-800 placeholder:text-slate-300"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Security Key</label>
                <button type="button" className="text-[10px] font-black uppercase text-orange-600 hover:text-orange-800 transition-colors tracking-widest">Forgot?</button>
              </div>
              <div className={`relative transition-all duration-300 ${focused === 'password' ? 'scale-[1.02]' : ''}`}>
                <HiOutlineLockClosed className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${focused === 'password' ? 'text-orange-600' : 'text-slate-400'}`} size={24} />
                <input
                  type="password"
                  required
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl pl-14 pr-6 py-5 outline-none focus:bg-white focus:border-orange-600 focus:ring-8 focus:ring-orange-500/5 transition-all font-bold text-slate-800 placeholder:text-slate-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className={`w-full py-6 rounded-3xl font-black text-white text-sm uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4 ${isLoading ? "bg-slate-300 cursor-not-allowed" : "bg-[#1a1d23] hover:bg-orange-600 shadow-orange-100 cursor-pointer"}`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Enter Hub <HiOutlineArrowRight size={22} className="stroke-[3]" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}