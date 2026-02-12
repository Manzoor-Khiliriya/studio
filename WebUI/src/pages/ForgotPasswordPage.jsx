import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForgotPasswordMutation } from "../services/authApi";
import { motion } from "framer-motion";
import { HiOutlineMail, HiArrowRight, HiArrowLeft } from "react-icons/hi";
import { RiShieldFlashLine } from "react-icons/ri";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(null);
  
  // You will need to add this mutation to your authApi.js
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const navigate = useNavigate();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    const resetPromise = forgotPassword({ 
      email: email.trim().toLowerCase() 
    }).unwrap();

    toast.promise(resetPromise, {
      loading: "Sending reset code...",
      success: "Code sent to your email!",
      error: (err) => err?.data?.message || "User not found",
    });

    try {
      await resetPromise;
      // We pass the email in state so the Reset Password page can auto-fill it
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      console.error("Forgot Password Error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <RiShieldFlashLine size={28} />
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-white">
          <button 
            onClick={() => navigate("/login")}
            className="group mb-6 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-orange-500 transition-colors cursor-pointer"
          >
            <HiArrowLeft className="group-hover:-translate-x-1 transition-transform"/> Back to Login
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              Forgot <span className="text-orange-500">Password?</span>
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              No worries! Enter your email and we'll send you a recovery code.
            </p>
          </div>

          <form onSubmit={handleRequestReset} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 ml-1">
                Registered Email
              </label>
              <div className="relative group">
                <HiOutlineMail 
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    focused === 'email' ? 'text-orange-500' : 'text-slate-300'
                  }`} 
                  size={20} 
                />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-12 pr-4 py-4 outline-none focus:bg-white focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/5 transition-all text-slate-800 font-bold"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={isLoading}
              className={`w-full py-5 rounded-2xl font-black text-white text-xs uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-2 ${
                isLoading 
                ? "bg-slate-200 cursor-not-allowed" 
                : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 cursor-pointer active:scale-95"
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Send Reset Code <HiArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-400 text-sm">
          Remember your password?{" "}
          <button 
            onClick={() => navigate("/login")}
            className="text-orange-500 font-bold hover:underline cursor-pointer"
          >
            Login
          </button>
        </p>
      </motion.div>
    </div>
  );
}