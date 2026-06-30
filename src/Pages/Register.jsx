// src/Pages/Register.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiUpload,
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

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_KEY || "";

const REMEMBER_ME_KEY = "thornview_remember_me";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

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
    description: "Manage products, users, orders and platform settings",
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
    description: "Manage inventory, orders and store operations",
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
    description: "Browse products, manage cart and place orders",
    icon: FiUser,
    className:
      "border-sky-200 bg-sky-50/70 hover:border-sky-400 dark:border-sky-900/60 dark:bg-sky-950/20",
    iconClassName:
      "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  },
];

function validatePassword(password) {
  const issues = [];

  if (password.length < 6) {
    issues.push("Password must contain at least 6 characters.");
  }

  if (!/[A-Za-z]/.test(password)) {
    issues.push("Password must contain at least one letter.");
  }

  if (!/[0-9]/.test(password)) {
    issues.push("Password must contain at least one number.");
  }

  return issues;
}

function getAuthErrorMessage(error) {
  const errorMessages = {
    "auth/account-exists-with-different-credential":
      "An account already exists with this email using another login method.",

    "auth/email-already-in-use": "An account already exists with this email.",

    "auth/invalid-credential": "Incorrect email or password.",

    "auth/invalid-email": "Please enter a valid email address.",

    "auth/network-request-failed":
      "Network error. Check your connection and try again.",

    "auth/operation-not-allowed":
      "This authentication method is not enabled in Firebase.",

    "auth/popup-blocked": "The Google popup was blocked by your browser.",

    "auth/popup-closed-by-user": "Google authentication was cancelled.",

    "auth/too-many-requests": "Too many attempts. Please wait and try again.",

    "auth/user-disabled": "This account has been disabled.",

    "auth/user-not-found": "No account was found with this email.",

    "auth/weak-password": "Please choose a stronger password.",

    "auth/wrong-password": "Incorrect email or password.",
  };

  return (
    errorMessages[error?.code] ||
    error?.message ||
    "Authentication failed. Please try again."
  );
}

async function uploadToImgBB(file) {
  if (!file) {
    return "";
  }

  if (!IMGBB_API_KEY) {
    throw new Error("Missing VITE_IMGBB_KEY environment variable.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error("Avatar image must be smaller than 5 MB.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    {
      method: "POST",
      body: formData,
    },
  );

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok || !responseData?.success) {
    throw new Error(responseData?.error?.message || "Avatar upload failed.");
  }

  return responseData?.data?.display_url || responseData?.data?.url || "";
}

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const toastTimerRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [activeAction, setActiveAction] = useState(null);

  const [toast, setToast] = useState(null);

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem(REMEMBER_ME_KEY) !== "false";
  });

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

  const isBusy = Boolean(activeAction);

  const passwordIssues = useMemo(
    () => validatePassword(formState.password),
    [formState.password],
  );

  const avatarPreview = useMemo(() => {
    if (!formState.avatarFile) {
      return "";
    }

    return URL.createObjectURL(formState.avatarFile);
  }, [formState.avatarFile]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function setField(key, value) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

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
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence,
    );

    localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));
  }

  async function exchangeFirebaseSession(firebaseUser) {
    const firebaseIdToken = await firebaseUser.getIdToken(true);

    if (!firebaseIdToken) {
      throw new Error("Could not generate a Firebase ID token.");
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        firebaseIdToken,
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

    const accessToken =
      responseData?.data?.accessToken ||
      responseData?.accessToken ||
      responseData?.token ||
      "";

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    }

    return {
      responseData,
      accessToken,
    };
  }

  async function synchronizeProfile({
    name,
    phone = "",
    avatar = "",
    marketingOptIn = false,
    accessToken = "",
  }) {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify({
          name,
          phone,
          avatar,
          marketingOptIn,
        }),
      });

      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}));

        console.warn("Profile synchronization failed:", responseData);
      }
    } catch (error) {
      console.warn("Optional profile synchronization failed:", error);
    }
  }

  async function completeAuthentication({ firebaseUser, successMessage }) {
    const { accessToken } = await exchangeFirebaseSession(firebaseUser);

    setUser?.(firebaseUser);

    showToast("success", successMessage);

    return accessToken;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = formState.name.trim();

    const email = formState.email.trim();

    const phone = formState.phone.trim();

    const password = formState.password;

    const confirmPassword = formState.confirmPassword;

    if (!name) {
      showToast("error", "Please enter your full name.");
      return;
    }

    if (!email) {
      showToast("error", "Please enter your email address.");
      return;
    }

    if (!formState.acceptTerms) {
      showToast("error", "You must accept the Terms & Conditions.");
      return;
    }

    if (passwordIssues.length > 0) {
      showToast("error", passwordIssues.join(" "));
      return;
    }

    if (password !== confirmPassword) {
      showToast("error", "Password and confirm password do not match.");
      return;
    }

    let firebaseUserCreated = false;

    try {
      setActiveAction("register");
      setToast(null);

      await configurePersistence();

      let avatarUrl = "";

      if (formState.avatarFile) {
        avatarUrl = await uploadToImgBB(formState.avatarFile);
      }

      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      firebaseUserCreated = true;

      await updateProfile(credential.user, {
        displayName: name,
        photoURL: avatarUrl || undefined,
      });

      const accessToken = await completeAuthentication({
        firebaseUser: credential.user,
        successMessage: "Account created successfully. Redirecting…",
      });

      await synchronizeProfile({
        name,
        phone,
        avatar: avatarUrl,
        marketingOptIn: formState.marketingOptIn,
        accessToken,
      });

      try {
        await sendEmailVerification(credential.user);
      } catch (verificationError) {
        console.warn(
          "Verification email could not be sent:",
          verificationError,
        );
      }

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

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      /*
       * Firebase account remains created if the
       * backend exchange fails. Sign out to avoid
       * leaving a half-authenticated browser state.
       */
      if (firebaseUserCreated) {
        await signOut(auth).catch(() => {});
      }

      showToast("error", getAuthErrorMessage(error));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleGoogleRegister() {
    let firebaseAuthenticated = false;

    try {
      setActiveAction("google");
      setToast(null);

      await configurePersistence();

      const credential = await signInWithPopup(auth, googleProvider);

      firebaseAuthenticated = true;

      const accessToken = await completeAuthentication({
        firebaseUser: credential.user,
        successMessage: "Google authentication successful. Redirecting…",
      });

      await synchronizeProfile({
        name: credential.user.displayName || "Google User",

        phone: credential.user.phoneNumber || "",

        avatar: credential.user.photoURL || "",

        marketingOptIn: false,
        accessToken,
      });

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      if (firebaseAuthenticated) {
        await signOut(auth).catch(() => {});
      }

      showToast("error", getAuthErrorMessage(error));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleDemoLogin(account) {
    let firebaseAuthenticated = false;

    try {
      setActiveAction(account.key);
      setToast(null);

      await configurePersistence();

      const credential = await signInWithEmailAndPassword(
        auth,
        account.email,
        account.password,
      );

      firebaseAuthenticated = true;

      await completeAuthentication({
        firebaseUser: credential.user,
        successMessage: `Signed in as ${account.role}. Redirecting…`,
      });

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      if (firebaseAuthenticated) {
        await signOut(auth).catch(() => {});
      }

      showToast("error", getAuthErrorMessage(error));
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <section className="py-8 md:py-14">
      <Container>
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* Left information panel */}
          <div className="relative overflow-hidden rounded-3xl border border-base-200/40 bg-gradient-to-br from-emerald-700 via-green-600 to-lime-500 text-white shadow-2xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_70%,white,transparent_45%)] opacity-10" />

            <div className="relative flex h-full flex-col justify-between px-7 py-8 md:px-10 md:py-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                  <FiUser className="h-3.5 w-3.5" />
                  Create account
                </div>

                <h1 className="mt-5 text-3xl font-black leading-tight md:text-4xl">
                  Join Thornview Grocery
                </h1>

                <p className="mt-4 max-w-lg text-sm leading-6 text-white/90 md:text-base">
                  Create an account to save addresses, manage your cart,
                  complete checkout faster and track every order.
                </p>

                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/15 bg-black/10 p-4">
                    <p className="font-bold">Secure authentication</p>

                    <p className="mt-2 text-sm text-white/80">
                      Firebase authentication with a protected backend session.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-black/10 p-4">
                    <p className="font-bold">Faster checkout</p>

                    <p className="mt-2 text-sm text-white/80">
                      Save your account and delivery information securely.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-black/10 p-4 sm:col-span-2">
                    <p className="flex items-center gap-2 font-bold">
                      <FiUsers />
                      Recruiter demo access
                    </p>

                    <p className="mt-2 text-sm text-white/80">
                      Reviewers can instantly explore Admin, Manager and
                      Customer experiences.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-white/15 pt-5 text-xs text-white/85 md:text-sm">
                Firebase Authentication • Google login • Email verification •
                Secure session
              </div>
            </div>
          </div>

          {/* Registration card */}
          <div className="card mx-auto w-full max-w-3xl rounded-3xl border border-base-200/70 bg-base-100 shadow-xl">
            <div className="card-body px-5 py-6 sm:px-7 md:px-9 md:py-8">
              <div className="text-center">
                <h2 className="text-2xl font-black md:text-3xl">
                  Create your account
                </h2>

                <p className="mt-2 text-sm text-base-content/60">
                  Register manually, continue with Google or explore a demo
                  role.
                </p>
              </div>

              {/* Demo accounts */}
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

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {DEMO_ACCOUNTS.map((account) => {
                    const AccountIcon = account.icon;

                    const isCurrentAction = activeAction === account.key;

                    return (
                      <button
                        key={account.key}
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDemoLogin(account)}
                        className={[
                          "flex flex-col items-start rounded-2xl border p-4 text-left",
                          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                          "disabled:cursor-not-allowed disabled:opacity-60",
                          account.className,
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            account.iconClassName,
                          ].join(" ")}
                        >
                          {isCurrentAction ? (
                            <span className="loading loading-spinner loading-sm" />
                          ) : (
                            <AccountIcon className="h-5 w-5" />
                          )}
                        </span>

                        <span className="mt-3 font-extrabold">
                          {account.role}
                        </span>

                        <span className="mt-1 text-xs text-base-content/60">
                          {account.description}
                        </span>

                        <span className="mt-3 flex items-center gap-1 text-xs font-bold">
                          Open demo
                          <FiArrowRight />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="divider my-5 text-xs uppercase tracking-widest text-base-content/40">
                Or create an account
              </div>

              {/* Google signup */}
              <button
                type="button"
                onClick={handleGoogleRegister}
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

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Name and email */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">
                        Full name
                      </span>
                    </label>

                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />

                      <input
                        type="text"
                        value={formState.name}
                        onChange={(event) =>
                          setField("name", event.target.value)
                        }
                        className="input input-bordered w-full rounded-xl pl-10"
                        placeholder="Your full name"
                        autoComplete="name"
                        disabled={isBusy}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">
                        Email
                      </span>
                    </label>

                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />

                      <input
                        type="email"
                        value={formState.email}
                        onChange={(event) =>
                          setField("email", event.target.value)
                        }
                        className="input input-bordered w-full rounded-xl pl-10"
                        placeholder="you@example.com"
                        autoComplete="email"
                        disabled={isBusy}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Phone and avatar */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">
                        Phone
                      </span>

                      <span className="label-text-alt text-xs text-base-content/45">
                        Optional
                      </span>
                    </label>

                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />

                      <input
                        type="tel"
                        value={formState.phone}
                        onChange={(event) =>
                          setField("phone", event.target.value)
                        }
                        className="input input-bordered w-full rounded-xl pl-10"
                        placeholder="+8801XXXXXXXXX"
                        autoComplete="tel"
                        disabled={isBusy}
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">
                        Avatar
                      </span>

                      <span className="label-text-alt text-xs text-base-content/45">
                        Max 5 MB
                      </span>
                    </label>

                    <div className="flex items-center gap-3">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="h-12 w-12 shrink-0 rounded-full border border-base-300 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-base-200">
                          <FiUser />
                        </div>
                      )}

                      <div className="relative w-full">
                        <FiUpload className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-base-content/40" />

                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            setField(
                              "avatarFile",
                              event.target.files?.[0] || null,
                            )
                          }
                          className="file-input file-input-bordered w-full rounded-xl pl-9"
                          disabled={isBusy}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">
                        Password
                      </span>
                    </label>

                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />

                      <input
                        type={showPassword ? "text" : "password"}
                        value={formState.password}
                        onChange={(event) =>
                          setField("password", event.target.value)
                        }
                        className="input input-bordered w-full rounded-xl pl-10 pr-11"
                        placeholder="Create password"
                        autoComplete="new-password"
                        disabled={isBusy}
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        disabled={isBusy}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>

                    {formState.password && passwordIssues.length > 0 && (
                      <p className="mt-1 text-xs text-error">
                        {passwordIssues.join(" ")}
                      </p>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">
                        Confirm password
                      </span>
                    </label>

                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />

                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formState.confirmPassword}
                        onChange={(event) =>
                          setField("confirmPassword", event.target.value)
                        }
                        className="input input-bordered w-full rounded-xl pl-10 pr-11"
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        disabled={isBusy}
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((current) => !current)
                        }
                        disabled={isBusy}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>

                    {formState.confirmPassword &&
                      formState.password !== formState.confirmPassword && (
                        <p className="mt-1 text-xs text-error">
                          Passwords do not match.
                        </p>
                      )}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3 rounded-2xl border border-base-200 bg-base-200/30 p-4">
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={formState.acceptTerms}
                      onChange={(event) =>
                        setField("acceptTerms", event.target.checked)
                      }
                      className="checkbox checkbox-success checkbox-sm mt-0.5"
                      disabled={isBusy}
                    />

                    <span>
                      I accept the{" "}
                      <Link
                        to="/terms"
                        className="font-bold text-emerald-700 hover:underline"
                      >
                        Terms & Conditions
                      </Link>
                      .
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={formState.marketingOptIn}
                      onChange={(event) =>
                        setField("marketingOptIn", event.target.checked)
                      }
                      className="checkbox checkbox-success checkbox-sm mt-0.5"
                      disabled={isBusy}
                    />

                    <span>Send me weekly flyers and promotional updates.</span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="checkbox checkbox-success checkbox-sm mt-0.5"
                      disabled={isBusy}
                    />

                    <span>Keep me signed in on this device.</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="btn w-full rounded-full border-0 bg-gradient-to-r from-emerald-600 via-green-600 to-lime-500 font-bold text-white shadow-lg hover:brightness-105"
                >
                  {activeAction === "register" ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create account
                      <FiArrowRight />
                    </>
                  )}
                </button>

                <p className="text-center text-sm">
                  Already have an account?{" "}
                  <Link
                    to="/auth/login"
                    className="font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </Container>

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
