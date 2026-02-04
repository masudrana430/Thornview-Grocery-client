import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiEye,
  FiEyeOff,
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiUpload,
} from "react-icons/fi";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebase/firebase.config";

import Container from "../Components/Container";

const apiBase = "http://localhost:5000";
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_KEY || "";

function validatePassword(pwd) {
  const issues = [];
  if (pwd.length < 6) issues.push("Password must be at least 6 characters.");
  return issues;
}

async function uploadToImgBB(file) {
  if (!IMGBB_API_KEY) throw new Error("Missing VITE_IMGBB_KEY (ImgBB key).");

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    { method: "POST", body: formData }
  );

  const data = await res.json();
  if (!data?.success) throw new Error("Avatar upload failed (ImgBB).");
  return data.data.display_url;
}

export default function Register() {
  const navigate = useNavigate();

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    marketingOptIn: false,
    avatarFile: null,
  });

  const pwdIssues = useMemo(
    () => validatePassword(formState.password),
    [formState.password]
  );

  function setField(key, value) {
    setFormState((s) => ({ ...s, [key]: value }));
  }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2800);
  };

  async function handleSubmit(e) {
    e.preventDefault();

    const name = formState.name.trim();
    const email = formState.email.trim();
    const phone = formState.phone.trim();
    const password = formState.password;
    const confirmPassword = formState.confirmPassword;

    if (!formState.acceptTerms) {
      showToast("error", "You must accept the Terms & Conditions.");
      return;
    }

    if (pwdIssues.length) {
      showToast("error", pwdIssues.join(" "));
      return;
    }

    if (password !== confirmPassword) {
      showToast("error", "Password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);
      setToast(null);

      // 1) Optional: upload avatar
      let avatarUrl = "";
      if (formState.avatarFile) {
        avatarUrl = await uploadToImgBB(formState.avatarFile);
      }

      // 2) Firebase signup
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // 3) Update Firebase profile
      await updateProfile(cred.user, {
        displayName: name,
        photoURL: avatarUrl || undefined,
      });

      // 4) Get FRESH Firebase ID token (IMPORTANT FIX)
      const firebaseIdToken = await cred.user.getIdToken(true);
      if (!firebaseIdToken) {
        throw new Error("Could not get Firebase ID token. Try again.");
      }

      // 5) Exchange Firebase token with backend
      const loginRes = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firebaseIdToken }),
      });

      const loginJson = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok) {
        // show exact backend error message
        throw new Error(
          loginJson?.error?.message ||
            `Login exchange failed (${loginRes.status}).`
        );
      }

      // 6) Email verification (recommended)
      // (doing it after exchange is fine too)
      try {
        await sendEmailVerification(cred.user);
      } catch {
        // ignore if blocked by Firebase limits etc.
      }

      // 7) Optional: Save extra profile fields in DB
      // Only works if your server has PATCH /api/users/me and auth cookies are set
      try {
        await fetch(`${apiBase}/api/users/me`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name,
            phone,
            marketingOptIn: formState.marketingOptIn,
            avatar: avatarUrl,
          }),
        });
      } catch (error) {
        console.warn("Optional profile sync failed:", error);
      }

      showToast("success", "Account created! Redirecting…");

      setFormState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
        marketingOptIn: false,
        avatarFile: null,
      });

      navigate("/", { replace: true });
    } catch (err) {
      const map = {
        "auth/email-already-in-use": "Email already in use.",
        "auth/invalid-email": "Invalid email address.",
        "auth/weak-password": "Password is too weak.",
        "auth/operation-not-allowed":
          "Email/password accounts are disabled in Firebase.",
      };

      const msg = map[err?.code] || err?.message || "Something went wrong.";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-10 md:py-16">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left - Info / Brand */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-lime-500 text-white shadow-2xl">
            <div className="relative px-7 py-7 md:px-9 md:py-9 flex flex-col h-full justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold uppercase tracking-[0.25em]">
                  Thomview Grocery
                </div>

                <h1 className="mt-4 text-2xl md:text-3xl font-extrabold leading-snug">
                  Create your account for faster checkout & order tracking.
                </h1>

                <p className="mt-3 text-sm md:text-base text-white/90 max-w-md">
                  Sign up once to manage your profile, save addresses, track
                  orders, and receive weekly flyers (optional).
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/15 text-xs md:text-sm">
                Tip: Please verify your email to secure your account.
              </div>
            </div>
          </div>

          {/* Right - Form */}
          <div className="card bg-base-100 w-full max-w-xl mx-auto shadow-xl border border-base-200/70 rounded-3xl">
            <div className="card-body px-6 py-6 md:px-8 md:py-7">
              <div className="mb-4 text-center">
                <h2 className="text-xl md:text-2xl font-bold">
                  Create an account
                </h2>
                <p className="mt-1 text-xs md:text-sm text-slate-500">
                  Fill your details below. You can update them anytime later.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Full name
                    </span>
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                    <input
                      className="input input-bordered w-full rounded-xl pl-10"
                      value={formState.name}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </span>
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                    <input
                      type="email"
                      className="input input-bordered w-full rounded-xl pl-10"
                      value={formState.email}
                      onChange={(e) => setField("email", e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phone (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                    <input
                      className="input input-bordered w-full rounded-xl pl-10"
                      value={formState.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      placeholder="+8801XXXXXXXXX"
                    />
                  </div>
                </div>

                {/* Avatar */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Avatar (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <FiUpload className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                    <input
                      type="file"
                      accept="image/*"
                      className="file-input file-input-bordered w-full rounded-xl pl-10"
                      onChange={(e) =>
                        setField("avatarFile", e.target.files?.[0] || null)
                      }
                    />
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Password
                      </span>
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                      <input
                        type={showPwd ? "text" : "password"}
                        className="input input-bordered w-full rounded-xl pl-10 pr-10"
                        value={formState.password}
                        onChange={(e) => setField("password", e.target.value)}
                        placeholder="Password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                      >
                        {showPwd ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {pwdIssues.length > 0 && (
                      <p className="mt-1 text-xs text-error">
                        {pwdIssues.join(" ")}
                      </p>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Confirm password
                      </span>
                    </label>
                    <input
                      type="password"
                      className="input input-bordered w-full rounded-xl"
                      value={formState.confirmPassword}
                      onChange={(e) =>
                        setField("confirmPassword", e.target.value)
                      }
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                </div>

                {/* Terms + Marketing */}
                <div className="space-y-2">
                  <label className="cursor-pointer flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mt-1"
                      checked={formState.acceptTerms}
                      onChange={(e) => setField("acceptTerms", e.target.checked)}
                    />
                    <span>
                      I accept the{" "}
                      <Link to="/terms" className="link link-primary">
                        Terms & Conditions
                      </Link>
                      .
                    </span>
                  </label>

                  <label className="cursor-pointer flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mt-1"
                      checked={formState.marketingOptIn}
                      onChange={(e) =>
                        setField("marketingOptIn", e.target.checked)
                      }
                    />
                    <span>Send me weekly flyers and promotions (optional).</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn w-full rounded-full border-0 bg-gradient-to-r from-emerald-600 via-green-600 to-lime-500 text-white font-semibold shadow-lg"
                  disabled={loading}
                >
                  {loading ? "Creating…" : "Create account"}
                </button>

                <p className="text-center text-xs md:text-sm mt-2">
                  Already have an account?{" "}
                  <Link
                    to="/auth/login"
                    className="font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Log in
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </Container>

      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div
            className={`alert ${
              toast.type === "success" ? "alert-success" : "alert-error"
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </section>
  );
}
