import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResetPasswordMutation } from "../services/authApi";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiArrowLeft,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiCheckCircle,
  HiOutlineMail,
  HiOutlineKey
} from "react-icons/hi";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Get the email passed from the Forgot Password page state
  const emailFromState = location.state?.email || "";

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [focused, setFocused] = useState(null);

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 2. Initialize form with the email from state
  const [form, setForm] = useState({
    email: emailFromState,
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  // 3. Safety Check: If no email is present, send them back to Step 1
  useEffect(() => {
    if (!emailFromState) {
      toast.error("Please request a reset code first");
      navigate("/forgot-password");
    }
  }, [emailFromState, navigate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const getStrength = (pass) => {
    if (pass.length === 0) return 0;
    if (pass.length < 6) return 1;
    if (pass.length >= 6 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) return 3;
    return 2;
  };

  const strength = getStrength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (strength < 2) {
      return toast.error("Please use a stronger password (include caps and numbers)");
    }

    try {
      // 4. Send the required fields to your updated backend controller
      await resetPassword({
        email: form.email.trim().toLowerCase(),
        otp: form.otp.trim(),
        newPassword: form.newPassword,
      }).unwrap();

      setIsSuccess(true);

      // Redirect to login after a brief success message
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      toast.error(err?.data?.message || "Verification failed. Please check your code.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-orange-500/5 border border-slate-100 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => navigate("/forgot-password")}
                className="group mb-8 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-orange-500 transition-colors cursor-pointer"
              >
                <HiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
              </button>

              <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                  Create New <span className="text-orange-500">Password</span>
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Enter the code sent to <b>{form.email}</b> and your new password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* EMAIL FIELD (Read-only or disabled is often better UX here) */}
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 ml-1">Account Email</label>
                  <div className="relative">
                    <HiOutlineMail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'email' ? 'text-orange-500' : 'text-slate-300'}`} size={20} />
                    <input
                      type="email"
                      name="email"
                      readOnly // Keep it readOnly since we got it from Step 1
                      className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none text-slate-500 font-bold cursor-not-allowed"
                      value={form.email}
                    />
                  </div>
                </div>

                {/* OTP / RESET CODE */}
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 ml-1">Verification Code</label>
                  <div className="relative">
                    <HiOutlineKey className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'otp' ? 'text-orange-500' : 'text-slate-300'}`} size={20} />
                    <input
                      type="text"
                      name="otp"
                      required
                      placeholder="6-digit code"
                      onFocus={() => setFocused('otp')}
                      onBlur={() => setFocused(null)}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-12 pr-4 py-4 outline-none focus:bg-white focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/5 transition-all text-slate-800 font-bold tracking-widest"
                      value={form.otp}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* NEW PASSWORD */}
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 ml-1">New Password</label>
                  <div className="relative">
                    <HiOutlineLockClosed className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'new' ? 'text-orange-500' : 'text-slate-300'}`} size={20} />
                    <input
                      type={showNew ? "text" : "password"}
                      name="newPassword"
                      required
                      placeholder="••••••••"
                      onFocus={() => setFocused('new')}
                      onBlur={() => setFocused(null)}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-12 pr-12 py-4 outline-none focus:bg-white focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/5 transition-all text-slate-800 font-bold"
                      value={form.newPassword}
                      onChange={handleChange}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-orange-500 transition-colors">
                      {showNew ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                    </button>
                  </div>
                  {/* Strength Meter */}
                  <div className="flex gap-1 mt-2 px-1">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${strength >= step ? (strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-yellow-400' : 'bg-orange-500') : 'bg-slate-100'}`} />
                    ))}
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 ml-1">Confirm Password</label>
                  <div className="relative">
                    <HiOutlineShieldCheck className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'confirm' ? 'text-orange-500' : 'text-slate-300'}`} size={20} />
                    <input
                      type={showConfirm ? "text" : "password"}
                      name="confirmPassword"
                      required
                      placeholder="••••••••"
                      onFocus={() => setFocused('confirm')}
                      onBlur={() => setFocused(null)}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-12 pr-12 py-4 outline-none focus:bg-white focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/5 transition-all text-slate-800 font-bold"
                      value={form.confirmPassword}
                      onChange={handleChange}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-orange-500 transition-colors">
                      {showConfirm ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  disabled={isLoading}
                  className={`w-full mt-4 py-5 rounded-2xl font-black text-white text-xs uppercase tracking-[0.2em] transition-all shadow-xl ${
                    isLoading ? "bg-slate-200 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 cursor-pointer active:scale-95"
                  }`}
                >
                  {isLoading ? "Verifying..." : "Update Password"}
                </button>
              </form>
            </motion.div>
          ) : (
            /* --- SUCCESS VIEW --- */
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-12 flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mb-6 text-green-500"
              >
                <HiCheckCircle size={100} />
              </motion.div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Success!</h2>
              <p className="text-slate-500 font-medium leading-relaxed">Your password has been reset successfully. Redirecting you to login...</p>

              <div className="mt-8 flex gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}