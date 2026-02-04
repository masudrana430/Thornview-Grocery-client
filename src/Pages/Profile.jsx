import React, { useContext, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Container from "../Components/Container";
import { AuthContext } from "../Provider/AuthProvider";
import Lottie from "lottie-react";
import { FiUser, FiImage, FiMail } from "react-icons/fi";
import Login from "./../animation/Secure Login.json";

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState(null); // {type:'success'|'error', message:string}

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setPhotoUrl(user.photoURL || "");
    }
  }, [user]);

  const preview = useMemo(
    () =>
      photoUrl ||
      "https://cdn-icons-png.freepik.com/512/6596/6596121.png",
    [photoUrl]
  );

  const firstName = useMemo(() => {
    const base = user?.displayName || "";
    const [first] = base.split(" ");
    return first || "there";
  }, [user]);

  // Not logged in state
  if (!user) {
    return (
      <section className="py-16 md:py-20 min-h-[calc(100vh-80px)]">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="card bg-base-100 border border-slate-100 shadow-2xl rounded-3xl overflow-hidden">
              <div className="card-body items-center text-center gap-4 md:gap-6">
                <div className="w-56 h-56 md:w-72 md:h-72">
                  <Lottie animationData={Login} loop />
                </div>
                <div>
                  <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 mb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Profile Locked
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    Sign in to view your profile
                  </h2>
                  <p className="mt-2 text-sm md:text-base text-slate-500 max-w-md mx-auto">
                    Your profile helps us personalize your experience and keep
                    your blood donation activity connected to you.
                  </p>
                </div>
                <Link
                  to="/auth/login"
                  className="btn rounded-full border-0 px-8 mt-2
                    bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700
                    text-white font-semibold shadow-lg shadow-rose-300/60
                    hover:shadow-rose-400/80 transition"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setToast(null);

    if (name.trim().length < 4) {
      const msg = "Name must be at least 4 characters.";
      setErr(msg);
      setToast({ type: "error", message: msg });
      return;
    }

    try {
      setLoading(true);
      await updateUser({
        displayName: name.trim(),
        photoURL: photoUrl.trim(),
      });
      setToast({ type: "success", message: "Profile updated!" });
    } catch (error) {
      const msg = error?.message || "Failed to update profile.";
      setErr(msg);
      setToast({ type: "error", message: msg });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 2400);
    }
  };

  return (
    <section className="py-10 md:py-16 min-h-[calc(100vh-80px)]">
      <Container>
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          {/* Hero header */}
          <div className="relative overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white shadow-[0_24px_60px_rgba(220,38,38,0.45)]">
            {/* subtle decorative circles */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-400/30 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-rose-300/20 blur-3xl" />

            <div className="relative px-6 py-6 md:px-8 md:py-8 grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6 md:gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-200" />
                  Account Center
                </div>
                <h1 className="mt-3 text-2xl md:text-3xl font-bold">
                  Hello, {firstName}
                </h1>
                <p className="mt-2 text-sm md:text-base text-rose-50/90 max-w-xl">
                  Manage your profile details so that we can recognise you
                  across your blood donation requests and contributions.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-rose-50/80">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-700/60 border border-rose-300/40">
                    <FiMail className="w-3 h-3" />
                    {user.email}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-700/40 border border-rose-300/40">
                    <FiUser className="w-3 h-3" />
                    Profile synced with authentication
                  </span>
                </div>
              </div>

              <div className="flex justify-center md:justify-end">
                <div className="relative">
                  <div className="h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-rose-100/90 bg-rose-900/20 flex items-center justify-center shadow-xl overflow-hidden">
                    <img
                      src={preview}
                      alt="avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-rose-900/80 text-[11px] font-semibold shadow-lg border border-rose-500/70">
                    Active profile
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content: overview + form */}
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] gap-6 md:gap-7">
            {/* Left: profile summary */}
            <div className="card bg-base-100 shadow-xl border border-slate-100 rounded-2xl">
              <div className="card-body">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="card-title text-base md:text-lg">
                    Profile overview
                  </h3>
                  <span className="badge badge-sm badge-ghost border-slate-200 text-[10px] uppercase tracking-wide">
                    Read only
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  This is how your basic account information appears inside the
                  application.
                </p>

                <div className="mt-5 flex flex-col items-center text-center gap-3">
                  <div className="relative">
                    <img
                      src={preview}
                      alt="avatar preview"
                      className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border border-slate-200 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-rose-500 h-3 w-3 border-2 border-base-100 shadow" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm md:text-base text-slate-900">
                      {user.displayName || "Unnamed user"}
                    </p>
                    <p className="text-xs md:text-sm text-slate-500 break-all">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="font-semibold text-[11px] uppercase tracking-wide text-slate-500">
                      Display name
                    </p>
                    <p className="mt-1 text-slate-800 break-words">
                      {name || "Not set yet"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="font-semibold text-[11px] uppercase tracking-wide text-slate-500">
                      Photo URL
                    </p>
                    <p className="mt-1 text-slate-700 break-words line-clamp-2">
                      {photoUrl || "Using default avatar"}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[11px] md:text-xs text-slate-500">
                  You can safely leave the photo URL empty if you prefer not to
                  use a custom picture. We will fall back to a neutral avatar.
                </p>
              </div>
            </div>

            {/* Right: update form */}
            <div className="card bg-base-100 shadow-xl border border-slate-100 rounded-2xl">
              <div className="card-body">
                <h3 className="card-title text-base md:text-lg">
                  Edit profile
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Update your public name and profile image. Your email address
                  stays managed by your authentication provider.
                </p>

                <form onSubmit={onSubmit} className="mt-5 grid gap-4">
                  <div className="form-control grid gap-1">
                    <label
                      className="label flex items-center gap-2 pb-1"
                      htmlFor="name"
                    >
                      <span className="label-text text-xs font-semibold tracking-wide text-slate-600">
                        Name
                      </span>
                      <span className="text-[10px] uppercase text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                        Required
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                        <FiUser className="w-4 h-4" />
                      </span>
                      <input
                        id="name"
                        type="text"
                        className={`input input-bordered w-full pl-9 ${
                          err ? "input-error" : ""
                        }`}
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-control grid gap-1">
                    <label
                      className="label flex items-center gap-2 pb-1"
                      htmlFor="photoUrl"
                    >
                      <span className="label-text text-xs font-semibold tracking-wide text-slate-600">
                        Photo URL
                      </span>
                      <span className="text-[10px] uppercase text-slate-400">
                        Optional
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                        <FiImage className="w-4 h-4" />
                      </span>
                      <input
                        id="photoUrl"
                        type="url"
                        className="input input-bordered w-full pl-9"
                        placeholder="https://example.com/me.jpg"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                      />
                    </div>
                    <span className="mt-2 text-xs text-slate-500">
                      Use a direct link to an image (JPG, PNG, etc.). The
                      avatar preview updates instantly on the left.
                    </span>
                  </div>

                  {err && (
                    <p className="text-error text-sm mt-1">{err}</p>
                  )}

                  <div className="mt-3 flex items-center justify-end gap-3">
                    <p className="hidden sm:block text-[11px] text-slate-500">
                      Changes may take a few seconds to sync across all pages.
                    </p>
                    <button
                      type="submit"
                      className="btn rounded-full px-6 border-0
                        bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700
                        text-white font-semibold shadow-md shadow-rose-300/60
                        hover:shadow-rose-400/80 transition"
                      disabled={loading}
                    >
                      {loading ? "Updating…" : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* toast */}
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
        </div>
      </Container>
    </section>
  );
};

export default Profile;
