import React, { useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import Container from "./Container";
import logo from "../assets/Group 427320775.png";
import { AuthContext } from "../Provider/AuthProvider";
import { toast } from "react-toastify";
import ThemeToggle from "./ThemeToggle";
import Lottie from "lottie-react";

import Home from "./../animation/Home.json";
import Issue from "./../animation/Search.json";
import AddIssue from "./../animation/Add Document.json";
import Donation from "./../animation/Donaciones.json";
import Profile from "./../animation/Profile user card.json";
import Logout from "./../animation/Animation - 1700989645104.json";
import Login from "./../animation/Pin code Password Protection, Secure Login animation.json";
import Register from "./../animation/register.json";

// 🔹 default profile picture
const DEFAULT_AVATAR_URL =
  "https://cdn-icons-png.freepik.com/512/6596/6596121.png";

// 🔹 Premium nav link styles (desktop + dropdown)
const navLinkClasses = ({ isActive }) =>
  [
    "group inline-flex items-center gap-2 text-[15px] font-semibold tracking-[0.02em]",
    "px-3 py-2 rounded-full transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#DC2626]",
    isActive
      ? "bg-gradient-to-r from-[#DC2626] via-[#EA384D] to-[#F97316] text-white shadow-md shadow-red-300/40"
      : "text-base-content/80 hover:text-base-content bg-transparent hover:bg-base-200/80 hover:shadow-sm hover:-translate-y-[1px]",
  ].join(" ");

// 🔹 if user has photoURL, use that; otherwise use your default image
const getAvatarUrl = (user) => {
  if (user?.photoURL) return user.photoURL;
  return DEFAULT_AVATAR_URL;
};

const Navbar = () => {
  const { user, logOut } = useContext(AuthContext);
  const isAuthed = !!user?.uid;

  const handleLogOut = () => {
    logOut()
      .then(() => toast.success("Logged out successfully"))
      .catch((err) => console.error("Error logging out:", err));
  };

  const links = isAuthed
    ? [
        {
          to: "/",
          label: "Home",
          end: true,
          emoji: (
            <Lottie
              animationData={Home}
              loop
              className="h-6 w-6 shrink-0"
              style={{ margin: 0 }}
            />
          ),
        },
        {
          to: "/search-donors",
          label: "Search Donors",
          emoji: (
            <Lottie
              animationData={Issue}
              loop
              className="h-6 w-6 shrink-0"
              style={{ margin: 0 }}
            />
          ),
        },
        {
          to: "/donation-requests",
          label: "Donation Requests",
          emoji: (
            <Lottie
              animationData={AddIssue}
              loop
              className="h-6 w-6 shrink-0"
              style={{ margin: 0 }}
            />
          ),
        },
        {
          to: "/funding",
          label: "Funding",
          emoji: (
            <Lottie
              animationData={Donation}
              loop
              className="h-6 w-6 shrink-0"
              style={{ margin: 0 }}
            />
          ),
        },
      ]
    : [
        {
          to: "/",
          label: "Home",
          end: true,
          emoji: (
            <Lottie
              animationData={Home}
              loop
              className="h-6 w-6 shrink-0"
              style={{ margin: 0 }}
            />
          ),
        },
        {
          to: "/donation-requests",
          label: "Donation Requests",
          emoji: (
            <Lottie
              animationData={AddIssue}
              loop
              className="h-6 w-6 shrink-0"
              style={{ margin: 0 }}
            />
          ),
        },
      ];

  const renderLinks = () =>
    links.map(({ to, label, end, emoji }) => (
      <li key={to}>
        <NavLink
          to={to}
          end={end}
          className={navLinkClasses}
        >
          <span className="inline-flex items-center gap-1">
            {emoji}
            <span>{label}</span>
          </span>
        </NavLink>
      </li>
    ));

  return (
    <Container>
      {/* Glass / pill navbar */}
      <div className="rounded-full shadow-xl border border-base-200/70 bg-white/80 backdrop-blur-lg">
        <div className="navbar bg-transparent px-4 lg:px-8 relative">
          {/* LOGO BUBBLE (sticks out on the left) */}
          <Link
            to="/"
            aria-label="Blood Donation Home"
            className="absolute -left-6 lg:-left-8 flex items-center justify-center"
          >
            <div className="bg-white rounded-full shadow-xl w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center border border-base-200/70">
              <img
                src={logo}
                alt="Give a Life logo"
                className="h-10 lg:h-14 w-auto"
              />
            </div>
          </Link>

          {/* LEFT: mobile menu (shifted right so it doesn't overlap logo) */}
          <div className="navbar-start ml-16 lg:ml-24">
            <div className="dropdown">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost lg:hidden"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h8m-8 6h16"
                  />
                </svg>
              </div>

              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 rounded-2xl z-20 mt-3 w-56 p-3 shadow-xl border border-base-200/70"
              >
                {renderLinks()}
                <li className="my-1 border-t border-base-200/70" />
                {!isAuthed ? (
                  <>
                    <li>
                      <NavLink to="/auth/login" className={navLinkClasses}>
                        <Lottie
                          animationData={Login}
                          loop
                          className="h-6 w-6 shrink-0"
                          style={{ margin: 0 }}
                        />
                        <span>Login</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/auth/register" className={navLinkClasses}>
                        <Lottie
                          animationData={Register}
                          loop
                          className="h-6 w-6 shrink-0"
                          style={{ margin: 0 }}
                        />
                        <span>Register</span>
                      </NavLink>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <NavLink to="/my-profile" className={navLinkClasses}>
                        <Lottie
                          animationData={Profile}
                          loop
                          className="h-6 w-6 shrink-0"
                          style={{ margin: 0 }}
                        />
                        <span>My Profile</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/dashboard" className={navLinkClasses}>
                        <Lottie
                          animationData={Profile}
                          loop
                          className="h-6 w-6 shrink-0"
                          style={{ margin: 0 }}
                        />
                        <span>Dashboard</span>
                      </NavLink>
                    </li>
                    <li>
                      <button
                        onClick={handleLogOut}
                        className="group inline-flex items-center gap-2 px-3 py-2 rounded-full text-[15px] font-semibold text-error hover:bg-error/10 transition"
                      >
                        <Lottie
                          animationData={Logout}
                          loop
                          className="h-6 w-6 shrink-0"
                          style={{ margin: 0 }}
                        />
                        <span>Logout</span>
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* CENTER (desktop links) */}
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1 gap-1">
              {renderLinks()}
            </ul>
          </div>

          {/* RIGHT: theme + auth buttons / avatar */}
          <div className="navbar-end gap-3">
            {/* <ThemeToggle /> */}

            {!isAuthed ? (
              <>
                <NavLink
                  to="/auth/login"
                  className="text-sm font-semibold rounded-full px-4 py-1.5 border border-[#F97316]/40 text-[#DC2626] hover:bg-[#FEF2F2] hover:border-[#DC2626]/70 transition-all"
                >
                  Log In
                </NavLink>
                <NavLink
                  to="/auth/register"
                  className="text-sm font-semibold text-white rounded-full px-5 py-1.5 shadow-md shadow-red-300/50 transition-all
                    bg-gradient-to-r from-[#DC2626] via-[#EA384D] to-[#F97316]
                    hover:shadow-red-400/80 hover:-translate-y-[1px]"
                >
                  Sign Up
                </NavLink>
              </>
            ) : (
              <div className="dropdown dropdown-end">
                <label
                  tabIndex={0}
                  className="btn btn-ghost btn-circle avatar border border-base-200/80 hover:border-[#DC2626]/60 transition"
                >
                  <div className="w-10 rounded-full overflow-hidden">
                    <img
                      src={getAvatarUrl(user)}
                      alt="User avatar"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_AVATAR_URL;
                      }}
                    />
                  </div>
                </label>
                <ul
                  tabIndex={0}
                  className="mt-3 z-20 p-3 shadow-xl menu menu-sm dropdown-content bg-base-100 rounded-2xl w-60 border border-base-200/70"
                >
                  <li className="px-2 pb-2 mb-2 border-b border-base-200/70">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold truncate">
                        {user?.displayName || "User"}
                      </span>
                      <span className="text-xs text-slate-500 truncate">
                        {user?.email}
                      </span>
                    </div>
                  </li>
                  <li>
                    <NavLink to="/my-profile" className={navLinkClasses}>
                      <Lottie
                        animationData={Profile}
                        loop
                        className="h-6 w-6 shrink-0"
                        style={{ margin: 0 }}
                      />
                      <span>My Profile</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/dashboard" className={navLinkClasses}>
                      <Lottie
                        animationData={Profile}
                        loop
                        className="h-6 w-6 shrink-0"
                        style={{ margin: 0 }}
                      />
                      <span>Dashboard</span>
                    </NavLink>
                  </li>
                  <li>
                    <button
                      onClick={handleLogOut}
                      className="group inline-flex items-center gap-2 px-3 py-2 rounded-full text-[15px] font-semibold text-error hover:bg-error/10 transition"
                    >
                      <Lottie
                        animationData={Logout}
                        loop
                        className="h-6 w-6 shrink-0"
                        style={{ margin: 0 }}
                      />
                      <span>Logout</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Navbar;
