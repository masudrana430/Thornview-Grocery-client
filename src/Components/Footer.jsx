// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  MdOutlineMail,
  MdOutlinePhone,
  MdOutlineLocationOn,
} from "react-icons/md";
import { FaFacebookF, FaInstagram, FaXTwitter } from "react-icons/fa6";
import Container from "./Container";
import logo from "../assets/logo.png";


function BrandMark() {
  return (
    <div className="inline-flex items-center gap-3">
      <img
        src={logo}
        alt="Thornview logo"
        className="w-9 h-9 rounded-2xl object-cover shadow-sm ring-1 ring-base-200/70"
      />
      <div className="leading-tight">
        <div className="text-sm font-extrabold tracking-tight text-slate-50">
          Thornview
        </div>
        <div className="text-xs font-semibold tracking-wide text-slate-300">
          Grocery
        </div>
      </div>
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2 text-sm text-slate-300 hover:text-slate-50 transition-colors"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70 group-hover:bg-emerald-300 transition-colors" />
      <span className="group-hover:translate-x-0.5 transition-transform">
        {children}
      </span>
    </Link>
  );
}

function Pill({ children }) {
  return (
    <span className="px-2.5 py-1 rounded-full bg-white/5 text-xs border border-white/10 text-slate-200">
      {children}
    </span>
  );
}

export default function Footer() {
  const shopLinks = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/cart", label: "Cart" },
    { to: "/checkout", label: "Checkout" },
  ];

  const accountLinks = [
    { to: "/my-profile", label: "My Profile" },
    { to: "/account/orders", label: "My Orders" },
    { to: "/auth/login", label: "Login" },
    { to: "/auth/register", label: "Create account" },
  ];

  const adminLinks = [
    { to: "/admin", label: "Admin Dashboard" },
    { to: "/admin/orders", label: "Admin Orders" },
    { to: "/admin/products", label: "Admin Products" },
    { to: "/admin/users", label: "Admin Users" },
  ];

  return (
    <footer className="mt-12 border-t border-white/5 bg-[#070A12] text-slate-100">
      {/* soft background glow */}
      <div
        className="pointer-events-none absolute left-0 right-0 h-72 opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(700px 240px at 15% 20%, rgba(16,185,129,.22), transparent 60%), radial-gradient(700px 240px at 85% 35%, rgba(34,197,94,.16), transparent 60%)",
        }}
      />
      <Container>
        <div className="relative  sm:px-6 lg:px-8 py-12">
          {/* TOP GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* BRAND + CONTACT */}
            <div className="lg:col-span-5">
              <Link
                to="/"
                aria-label="Thornview Grocery Home"
                className="inline-flex"
              >
                <BrandMark />
              </Link>

              <p className="mt-4 text-sm leading-6 text-slate-300 max-w-lg">
                Fresh groceries delivered fast. Shop essentials, schedule
                delivery or pickup, and track your orders in one place.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold tracking-wider uppercase text-slate-200">
                  Contact
                </div>

                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <MdOutlineMail className="mt-0.5 text-emerald-400" />
                    <a
                      href="mailto:support@thornview.com"
                      className="link link-hover text-slate-200"
                    >
                      support@thornview.com
                    </a>
                  </li>

                  <li className="flex items-start gap-2">
                    <MdOutlinePhone className="mt-0.5 text-emerald-400" />
                    <a
                      href="tel:+880-1XXX-XXXXXX"
                      className="link link-hover text-slate-200"
                    >
                      +880 1XXX-XXXXXX
                    </a>
                  </li>

                  <li className="flex items-start gap-2">
                    <MdOutlineLocationOn className="mt-0.5 text-emerald-400" />
                    <span className="text-slate-300">
                      Your City, Bangladesh — Delivery & Pickup available
                    </span>
                  </li>
                </ul>

                {/* Social */}
                <div className="mt-4 flex items-center gap-2">
                  <Pill>Follow</Pill>

                  <a
                    href="#"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-white/10 bg-black/20
                             hover:bg-white/10 hover:border-white/20 transition-colors"
                    aria-label="Facebook"
                    title="Facebook"
                  >
                    <FaFacebookF className="h-4 w-4" />
                  </a>

                  <a
                    href="#"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-white/10 bg-black/20
                             hover:bg-white/10 hover:border-white/20 transition-colors"
                    aria-label="Instagram"
                    title="Instagram"
                  >
                    <FaInstagram className="h-4 w-4" />
                  </a>

                  <a
                    href="https://x.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-white/10 bg-black/20
                             hover:bg-white/10 hover:border-white/20 transition-colors"
                    aria-label="X"
                    title="X"
                  >
                    <FaXTwitter className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* LINKS */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-200">
                  Shop
                </h4>
                <div className="mt-4 flex flex-col gap-2">
                  {shopLinks.map((i) => (
                    <FooterLink key={i.label} to={i.to}>
                      {i.label}
                    </FooterLink>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-200">
                  Account
                </h4>
                <div className="mt-4 flex flex-col gap-2">
                  {accountLinks.map((i) => (
                    <FooterLink key={i.label} to={i.to}>
                      {i.label}
                    </FooterLink>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-200">
                  Admin
                </h4>
                <div className="mt-4 flex flex-col gap-2">
                  {adminLinks.map((i) => (
                    <FooterLink key={i.label} to={i.to}>
                      {i.label}
                    </FooterLink>
                  ))}
                </div>

                <div className="mt-4 text-xs text-slate-400">
                  Admin links will work only for users with{" "}
                  <span className="text-slate-200 font-semibold">
                    admin/manager
                  </span>{" "}
                  role.
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Newsletter */}
            <div className="w-full lg:max-w-xl">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-50">
                      Get offers & updates
                    </div>
                    <div className="text-xs text-slate-300">
                      New arrivals, discounts, and delivery updates.
                    </div>
                  </div>

                  <form
                    className="flex w-full md:w-auto"
                    onSubmit={(e) => {
                      e.preventDefault();
                      alert("Subscribed! (connect this to your backend later)");
                    }}
                  >
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      className="input input-bordered rounded-r-none w-full md:w-72 bg-black/20 border-white/10
                               text-slate-100 placeholder:text-slate-500 focus:border-emerald-400"
                    />
                    <button
                      type="submit"
                      className="btn rounded-l-none border-0 text-sm font-semibold text-white px-5
                               bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500
                               hover:from-emerald-400 hover:via-green-400 hover:to-lime-400
                               transition-all duration-300"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full lg:w-auto">
              <p className="text-xs md:text-sm text-slate-300 text-center sm:text-left">
                © {new Date().getFullYear()}{" "}
                <span className="font-semibold text-slate-100">
                  Thornview Grocery
                </span>
                . All rights reserved.
              </p>

              <div className="flex items-center gap-2">
                <Pill>Fast Delivery</Pill>
                <Pill>Pickup Slots</Pill>
                <Pill>Secure Payments</Pill>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
