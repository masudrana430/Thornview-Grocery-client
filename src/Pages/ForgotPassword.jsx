// src/Pages/ForgotPassword.jsx
import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../Provider/AuthProvider";


export default function ForgotPassword() {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const emailFromState = location.state?.email || "";
  const emailFromQuery = new URLSearchParams(location.search).get("email") || "";
  const [email, setEmail] = useState(emailFromState || emailFromQuery || "");

  const [toast, setToast] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email && user?.email) setEmail(user.email);
  }, [user, email]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setToast(null);

    if (!email) {
      const msg = "Please enter your email.";
      setErr(msg);
      setToast({ type: "error", message: msg });
      return;
    }

    try {
      setLoading(true);

      

      setToast({ type: "success", message: "Opening Gmail to reset your password…" });
      window.location.href = "https://mail.google.com/";
    } catch (error) {
      const map = {
        "auth/invalid-email": "Invalid email address.",
        "auth/user-not-found": "No account with that email.",
      };
      const msg = map[error.code] || error.message;
      setErr(msg);
      setToast({ type: "error", message: msg });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center py-12">
      <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl py-5">
        <h2 className="card-title justify-center pt-6">Reset your password</h2>

        <form onSubmit={onSubmit} className="card-body">
          <fieldset className="fieldset">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input input-bordered"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {err && <p className="text-error text-sm mt-2">{err}</p>}

            <button type="submit" className="btn btn-neutral mt-4" disabled={loading}>
              {loading ? "Sending…" : "Reset Password"}
            </button>

            <p className="text-center font-semibold mt-4">
              Remembered it?{" "}
              <Link to="/auth/login" className="link link-hover text-purple-500">Back to login</Link>
            </p>
          </fieldset>
        </form>
      </div>

      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div className={`alert ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
