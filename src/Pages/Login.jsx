// src/pages/Login.jsx
import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "../hooks/useAuth";
import { auth } from "../firebase/firebase.config";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiArrowRight,
  FiShield,
  FiShoppingCart,
  FiTruck,
} from "react-icons/fi";
import Container from "../Components/Container";

// <<<<<<< HEAD
const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
// =======
// const apiBase =  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
// >>>>>>> 7ced122 (WIP:)

export default function Login() {
  const { setUser, setLoading: setGlobalLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => location.state?.from?.pathname || "/", [location.state]);

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2800);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast("error", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      setGlobalLoading?.(true);

      // 1) Firebase sign in
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

      // 2) Get Firebase ID token
      const firebaseIdToken = await cred.user.getIdToken();

      // 3) Exchange token with backend (sets httpOnly JWT cookies)
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firebaseIdToken }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || "Login exchange failed.");
      }

      setUser?.(cred.user);
      showToast("success", "Welcome back! Redirecting…");
      navigate(from, { replace: true });
    } catch (err) {
      const map = {
        "auth/invalid-email": "Invalid email address.",
        "auth/user-disabled": "This account has been disabled.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
      };
      showToast("error", map[err?.code] || err?.message || "Login failed.");
    } finally {
      setLoading(false);
      setGlobalLoading?.(false);
    }
  };

  const handleReset = async () => {
    const e = email.trim();
    if (!e) {
      showToast("error", "Enter your email first, then click reset.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, e);
      showToast("success", "Password reset email sent. Check your inbox.");
    } catch (err) {
      const map = {
        "auth/invalid-email": "Invalid email address.",
        "auth/user-not-found": "No account found with this email.",
      };
      showToast("error", map[err?.code] || "Could not send reset email.");
    }
  };

  return (
    <section className="py-10 md:py-16">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-8 items-stretch">
          {/* Left: Premium brand panel */}
          <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-base-200/40 bg-gradient-to-br from-emerald-600 via-green-600 to-lime-500 text-white">
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-black/10 blur-2xl" />
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_30%,white,transparent_40%),radial-gradient(circle_at_40%_80%,white,transparent_45%)]" />

            <div className="relative h-full px-7 py-7 md:px-9 md:py-9 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold uppercase tracking-[0.25em]">
                  <FiShield className="w-3.5 h-3.5" />
                  Secure access
                </div>

                <h1 className="mt-4 text-2xl md:text-3xl font-extrabold leading-snug">
                  Sign in to Thomview Grocery
                </h1>

                <p className="mt-3 text-sm md:text-base text-white/90 max-w-md">
                  Manage your profile, checkout faster, track orders, and get weekly flyer updates (optional).
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
                  <div className="rounded-2xl bg-black/10 p-3.5 border border-white/15">
                    <p className="font-semibold flex items-center gap-2">
                      <FiShoppingCart className="w-4 h-4" />
                      Faster checkout
                    </p>
                    <p className="mt-1 text-white/85">
                      Save addresses and reuse details for quick ordering.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/10 p-3.5 border border-white/15">
                    <p className="font-semibold flex items-center gap-2">
                      <FiTruck className="w-4 h-4" />
                      Order tracking
                    </p>
                    <p className="mt-1 text-white/85">
                      Track pickup/delivery status in real time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/15 text-xs md:text-sm flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-200" />
                  Auth: Firebase + App JWT cookies
                </span>
                <span className="opacity-85">Your session refreshes automatically.</span>
              </div>
            </div>
          </div>

          {/* Right: Login card */}
          <div className="card bg-base-100 w-full max-w-xl mx-auto shadow-xl border border-base-200/70 rounded-3xl">
            <div className="card-body px-6 py-6 md:px-8 md:py-7">
              <div className="text-center mb-4">
                <h2 className="text-xl md:text-2xl font-bold">Welcome back</h2>
                <p className="mt-1 text-xs md:text-sm text-slate-500">
                  Enter your credentials to continue.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div className="form-control">
                  <label className="label" htmlFor="email">
                    <span className="label-text text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </span>
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      className="input input-bordered w-full rounded-xl pl-10"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-control">
                  <label className="label" htmlFor="password">
                    <span className="label-text text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Password
                    </span>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Forgot password?
                    </button>
                  </label>

                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      className="input input-bordered w-full rounded-xl pl-10 pr-10"
                      placeholder="Your password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between">
                  <label className="cursor-pointer flex items-center gap-2 text-sm">
                    <input type="checkbox" className="checkbox checkbox-sm" />
                    <span>Remember me</span>
                  </label>
                  <span className="text-xs text-slate-500">Secure cookies enabled</span>
                </div>

                <button
                  type="submit"
                  className="btn w-full rounded-full border-0 bg-gradient-to-r from-emerald-600 via-green-600 to-lime-500 text-white font-semibold shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Continue <FiArrowRight />
                    </span>
                  )}
                </button>

                <p className="text-center text-xs md:text-sm">
                  New to Thomview?{" "}
                  <Link
                    to="/auth/register"
                    className="font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Create an account
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </Container>

      {/* Toast */}
      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div className={`alert ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </section>
  );
}
