// src/Pages/Login.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiShoppingCart,
  FiTruck,
  FiUser,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

import Container from "../Components/Container";
import { auth } from "../firebase/firebase.config";
import { useAuth } from "../hooks/useAuth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const REMEMBER_ME_KEY = "thornview_remember_me";

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

const DEMO_ACCOUNTS = [
  {
    key: "admin",
    role: "Admin",
    email: "admin@gmail.com",
    password: "Admin123",
    description: "Products, users, orders and platform control",
    icon: FiShield,
    className:
      "border-rose-200 bg-rose-50/70 hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/20",
    iconClassName:
      "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  },
  {
    key: "manager",
    role: "Manager",
    email: "manager@gmail.com",
    password: "manager123",
    description: "Inventory, orders and operational management",
    icon: FiUserCheck,
    className:
      "border-amber-200 bg-amber-50/70 hover:border-amber-400 dark:border-amber-900/60 dark:bg-amber-950/20",
    iconClassName:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  },
  {
    key: "customer",
    role: "Customer",
    email: "customer@gmail.com",
    password: "customer123",
    description: "Shopping, cart, checkout and order tracking",
    icon: FiUser,
    className:
      "border-sky-200 bg-sky-50/70 hover:border-sky-400 dark:border-sky-900/60 dark:bg-sky-950/20",
    iconClassName:
      "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  },
];

function getAuthErrorMessage(error) {
  const errorMessages = {
    "auth/account-exists-with-different-credential":
      "An account already exists with the same email using another login method.",
    "auth/email-already-in-use": "This email is already registered.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/network-request-failed":
      "Network error. Check your connection and try again.",
    "auth/operation-not-allowed":
      "This login method is not enabled in Firebase.",
    "auth/popup-blocked": "The Google login popup was blocked by your browser.",
    "auth/popup-closed-by-user": "Google login was cancelled.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account was found with this email.",
    "auth/wrong-password": "Incorrect email or password.",
  };

  return (
    errorMessages[error?.code] ||
    error?.message ||
    "Authentication failed. Please try again."
  );
}

export default function Login() {
  const { setUser, setLoading: setGlobalLoading } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const toastTimerRef = useRef(null);

  const redirectPath = useMemo(() => {
    const pathname = location.state?.from?.pathname || "/";

    const search = location.state?.from?.search || "";

    return `${pathname}${search}`;
  }, [location.state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem(REMEMBER_ME_KEY) !== "false";
  });

  /*
   * Possible values:
   * null | "manual" | "google" |
   * "admin" | "manager" | "customer" | "reset"
   */
  const [activeAction, setActiveAction] = useState(null);

  const [toast, setToast] = useState(null);

  const isBusy = Boolean(activeAction);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function showToast(type, message) {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({
      type,
      message,
    });

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  }

  async function configurePersistence() {
    const persistence = rememberMe
      ? browserLocalPersistence
      : browserSessionPersistence;

    await setPersistence(auth, persistence);

    localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));
  }

  async function exchangeFirebaseSession(firebaseUser) {
    const firebaseIdToken = await firebaseUser.getIdToken(true);

    if (!firebaseIdToken) {
      throw new Error("Could not create a Firebase ID token.");
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        firebaseIdToken,

        /*
         * Your backend may use this value to choose
         * between a session cookie and a persistent
         * refresh cookie.
         */
        rememberMe,
      }),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        responseData?.error?.message ||
          responseData?.message ||
          `Backend login failed (${response.status}).`,
      );
    }

    /*
     * Supports several common response structures:
     *
     * { data: { accessToken: "..." } }
     * { accessToken: "..." }
     * { token: "..." }
     */
    const accessToken =
      responseData?.data?.accessToken ||
      responseData?.accessToken ||
      responseData?.token;

    if (accessToken) {
      /*
       * Keep compatibility with the current API helper,
       * which reads accessToken from localStorage.
       */
      localStorage.setItem("accessToken", accessToken);
    }

    return responseData;
  }

  async function finishLogin(firebaseUser) {
    await exchangeFirebaseSession(firebaseUser);

    setUser?.(firebaseUser);

    showToast("success", "Login successful. Redirecting…");

    navigate(redirectPath, {
      replace: true,
    });
  }

  async function loginWithEmailAndPassword({
    loginEmail,
    loginPassword,
    actionName,
  }) {
    const normalizedEmail = loginEmail.trim();

    if (!normalizedEmail || !loginPassword) {
      showToast("error", "Please enter your email and password.");

      return;
    }

    let firebaseLoginCompleted = false;

    try {
      setActiveAction(actionName);
      setGlobalLoading?.(true);
      setToast(null);

      await configurePersistence();

      const credential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        loginPassword,
      );

      firebaseLoginCompleted = true;

      await finishLogin(credential.user);
    } catch (error) {
      /*
       * Prevent a half-authenticated state when
       * Firebase succeeds but the backend exchange fails.
       */
      if (firebaseLoginCompleted) {
        await signOut(auth).catch(() => {});
      }

      showToast("error", getAuthErrorMessage(error));
    } finally {
      setActiveAction(null);
      setGlobalLoading?.(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    await loginWithEmailAndPassword({
      loginEmail: email,
      loginPassword: password,
      actionName: "manual",
    });
  }

  async function handleDemoLogin(account) {
    setEmail(account.email);
    setPassword(account.password);

    await loginWithEmailAndPassword({
      loginEmail: account.email,
      loginPassword: account.password,
      actionName: account.key,
    });
  }

  async function handleGoogleLogin() {
    let firebaseLoginCompleted = false;

    try {
      setActiveAction("google");
      setGlobalLoading?.(true);
      setToast(null);

      await configurePersistence();

      const result = await signInWithPopup(auth, googleProvider);

      firebaseLoginCompleted = true;

      await finishLogin(result.user);
    } catch (error) {
      if (firebaseLoginCompleted) {
        await signOut(auth).catch(() => {});
      }

      showToast("error", getAuthErrorMessage(error));
    } finally {
      setActiveAction(null);
      setGlobalLoading?.(false);
    }
  }

  async function handlePasswordReset() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      showToast(
        "error",
        "Enter your email address first, then click Forgot password.",
      );

      return;
    }

    try {
      setActiveAction("reset");
      setToast(null);

      await sendPasswordResetEmail(auth, normalizedEmail);

      showToast(
        "success",
        "Password reset email sent. Check your inbox and spam folder.",
      );
    } catch (error) {
      showToast("error", getAuthErrorMessage(error));
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <section className="py-8 md:py-14">
      <Container>
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {/* Left information panel */}
          <div className="relative overflow-hidden rounded-3xl border border-base-200/40 bg-gradient-to-br from-emerald-700 via-green-600 to-lime-500 text-white shadow-2xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_70%,white,transparent_45%)] opacity-10" />

            <div className="relative flex h-full flex-col justify-between px-7 py-8 md:px-10 md:py-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                  <FiShield className="h-3.5 w-3.5" />
                  Secure access
                </div>

                <h1 className="mt-5 text-3xl font-black leading-tight md:text-4xl">
                  Welcome to Thornview Grocery
                </h1>

                <p className="mt-4 max-w-lg text-sm leading-6 text-white/90 md:text-base">
                  Sign in to shop, manage products, process orders, access
                  dashboards and experience the complete role-based grocery
                  platform.
                </p>

                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/15 bg-black/10 p-4">
                    <p className="flex items-center gap-2 font-semibold">
                      <FiShoppingCart />
                      Faster checkout
                    </p>

                    <p className="mt-2 text-sm text-white/80">
                      Save your cart, addresses and order information.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-black/10 p-4">
                    <p className="flex items-center gap-2 font-semibold">
                      <FiTruck />
                      Order tracking
                    </p>

                    <p className="mt-2 text-sm text-white/80">
                      Follow pickup and delivery progress from your dashboard.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-black/10 p-4 sm:col-span-2">
                    <p className="flex items-center gap-2 font-semibold">
                      <FiUsers />
                      Role-based experience
                    </p>

                    <p className="mt-2 text-sm text-white/80">
                      Explore separate Admin, Manager and Customer experiences
                      using the demo accounts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-white/15 pt-5 text-xs text-white/85 md:text-sm">
                Firebase Authentication • Secure backend session • Role-based
                authorization
              </div>
            </div>
          </div>

          {/* Login card */}
          <div className="card mx-auto w-full max-w-2xl rounded-3xl border border-base-200/70 bg-base-100 shadow-xl">
            <div className="card-body px-5 py-6 sm:px-7 md:px-9 md:py-8">
              <div className="text-center">
                <h2 className="text-2xl font-black md:text-3xl">Sign in</h2>

                <p className="mt-2 text-sm text-base-content/60">
                  Use your account or select a demo role.
                </p>
              </div>

              {/* Demo account buttons */}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold">Quick demo access</h3>

                    <p className="text-xs text-base-content/55">
                      One-click access for recruiters and reviewers
                    </p>
                  </div>

                  <span className="badge badge-success badge-outline">
                    Demo
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {DEMO_ACCOUNTS.map((account) => {
                    const AccountIcon = account.icon;

                    const isCurrentAction = activeAction === account.key;

                    return (
                      <button
                        key={account.key}
                        type="button"
                        onClick={() => handleDemoLogin(account)}
                        disabled={isBusy}
                        className={[
                          "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left",
                          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                          "disabled:cursor-not-allowed disabled:opacity-60",
                          account.className,
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                            account.iconClassName,
                          ].join(" ")}
                        >
                          {isCurrentAction ? (
                            <span className="loading loading-spinner loading-sm" />
                          ) : (
                            <AccountIcon className="h-5 w-5" />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block font-extrabold">
                            Continue as {account.role}
                          </span>

                          <span className="mt-0.5 block text-xs text-base-content/60">
                            {account.description}
                          </span>
                        </span>

                        <FiArrowRight className="shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="divider my-5 text-xs uppercase tracking-widest text-base-content/40">
                Or use your account
              </div>

              {/* Google login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isBusy}
                className="btn w-full rounded-full border-base-300 bg-base-100 text-base-content hover:bg-base-200"
              >
                {activeAction === "google" ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <FcGoogle className="h-5 w-5" />
                )}
                Continue with Google
              </button>

              <form onSubmit={handleLogin} className="mt-5 space-y-4">
                {/* Email */}
                <div className="form-control">
                  <label className="label" htmlFor="email">
                    <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">
                      Email
                    </span>
                  </label>

                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="input input-bordered w-full rounded-xl pl-10"
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={isBusy}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-control">
                  <label className="label" htmlFor="password">
                    <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">
                      Password
                    </span>

                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={isBusy}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
                    >
                      {activeAction === "reset"
                        ? "Sending…"
                        : "Forgot password?"}
                    </button>
                  </label>

                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="input input-bordered w-full rounded-xl pl-10 pr-11"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isBusy}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={isBusy}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content disabled:opacity-50"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="checkbox checkbox-success checkbox-sm"
                      disabled={isBusy}
                    />

                    <span>Remember me</span>
                  </label>

                  <span className="text-xs text-base-content/50">
                    {rememberMe
                      ? "Stay signed in on this device"
                      : "Sign out when this session ends"}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="btn w-full rounded-full border-0 bg-gradient-to-r from-emerald-600 via-green-600 to-lime-500 font-bold text-white shadow-lg hover:brightness-105"
                >
                  {activeAction === "manual" ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Continue
                      <FiArrowRight />
                    </>
                  )}
                </button>

                <p className="text-center text-sm">
                  New to Thornview?{" "}
                  <Link
                    to="/auth/register"
                    className="font-bold text-emerald-700 hover:text-emerald-800"
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
        <div className="toast toast-end toast-top z-[100]">
          <div
            className={[
              "alert shadow-lg",
              toast.type === "success" ? "alert-success" : "alert-error",
            ].join(" ")}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </section>
  );
}
