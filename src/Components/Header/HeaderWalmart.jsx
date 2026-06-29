import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiPackage,
  FiChevronDown,
  FiX,
  FiLogOut,
  FiShield,
  FiMapPin,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { CartContext } from "../../context/CartContext";
import { apiGet } from "../../services/api";
import MegaMenu from "./MegaMenu";
import SearchBox from "./SearchBox";
import logo from "../../assets/logo.png";
import ThemeToggle from "../../Pages/Home/components/ThemeToggle";

export default function HeaderWalmart() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logOut } = useAuth();
  const { cartCount } = useContext(CartContext);

  const [categories, setCategories] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // close drawer on route change
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const data = await apiGet("/api/categories", { signal: ctrl.signal });
        setCategories(data?.data?.categories || []);
      } catch {
        setCategories([]);
      }
    })();
    return () => ctrl.abort();
  }, []);

  const displayName = useMemo(() => {
    if (!user?.email) return "Sign in";
    return user?.displayName || user?.email?.split("@")?.[0] || "Account";
  }, [user]);

  const initials = useMemo(() => {
    if (!user?.email) return "";
    const base = (user?.displayName || user?.email || "U").trim();
    const parts = base.split(" ");
    const a = parts?.[0]?.[0] || "U";
    const b = parts?.[1]?.[0] || "";
    return (a + b).toUpperCase();
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
      await logOut();
      navigate("/");
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* overlay drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        initials={initials}
        displayName={displayName}
        categories={categories}
        onLogout={handleLogout}
      />

      <header
        className={[
          "w-full relative z-[99990] ",
          "bg-base-100/92 backdrop-blur",
          "border-b border-base-200/70",
          "transition-shadow duration-200",
          scrolled ? "shadow-md" : "shadow-none",
        ].join(" ")}
      >
        {/* Main bar */}
        <div className=" w-full  px-3 md:px-4">
          <div className="h-14 md:h-16 flex items-center gap-2">
            {/* LEFT (mobile hamburger + logo) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Hamburger (mobile) */}
              <button
                type="button"
                className="md:hidden btn btn-ghost btn-sm rounded-full"
                aria-label="Open menu"
                onClick={() => setDrawerOpen(true)}
              >
                <FiMenu className="text-xl" />
              </button>

              {/* Logo */}
              <Link to="/" className="flex items-center gap-2">
                <img
                  src={logo}
                  alt="Thornview"
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover ring-1 ring-base-200"
                />
                <div className="hidden sm:block leading-tight">
                  <div className="font-extrabold tracking-tight">Thornview</div>
                  <div className="text-[11px] opacity-70 -mt-0.5">Grocery</div>
                </div>
              </Link>

              {/* Departments (desktop) */}
              <div className="hidden md:flex items-center ml-2">
                <div className="dropdown">
                  <label
                    tabIndex={0}
                    className="btn btn-sm rounded-full bg-base-100 border border-base-200 shadow-sm hover:shadow-md"
                  >
                    Departments <FiChevronDown className="opacity-70" />
                  </label>
                  <div className="dropdown-content z-[80] mt-3 rounded-2xl bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                    <MegaMenu categories={categories} />
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER (search) */}
            <div className="flex-1 min-w-0 px-1 md:px-4">
              {/* If your SearchBox is already styled, keep it; wrapper forces a Walmart-like pill */}
              <div className="relative w-full">
                <div className="rounded-full border border-base-200 bg-base-100 shadow-sm hover:shadow-md focus-within:shadow-md transition">
                  <SearchBox />
                </div>
              </div>
            </div>
            <ThemeToggle />

            {/* RIGHT (icons) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Account */}
              <div className="dropdown dropdown-end hidden md:block relative z-[99995]">
                <label
                  tabIndex={0}
                  className="btn btn-sm rounded-full bg-base-100 border border-base-200 shadow-sm"
                >
                  <span className="grid place-items-center w-7 h-7 rounded-full bg-base-200/60">
                    {user?.email ? (
                      <span className="text-[11px] font-extrabold">
                        {initials}
                      </span>
                    ) : (
                      <FiUser className="text-lg" />
                    )}
                  </span>
                  <span className="hidden lg:inline max-w-[10rem] truncate">
                    {user?.email ? `Hi, ${displayName}` : "Sign in"}
                  </span>
                  <FiChevronDown className="opacity-70 hidden lg:inline" />
                </label>

                <div className="dropdown-content z-[1000000] mt-3 w-72 rounded-2xl bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                  <div className="p-4 border-b border-base-200">
                    {user?.email ? (
                      <>
                        <div className="font-semibold truncate">
                          {displayName}
                        </div>
                        <div className="text-xs opacity-70 truncate">
                          {user.email}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm opacity-80">
                        Sign in to track orders faster.
                      </div>
                    )}
                  </div>

                  <div className="p-2 space-y-1 ">
                    {user?.email ? (
                      <>
                        <Link
                          to="/my-profile"
                          className="btn btn-sm w-full justify-start rounded-xl btn-ghost"
                        >
                          <FiUser /> Profile
                        </Link>
                        <Link
                          to="/account/orders"
                          className="btn btn-sm w-full justify-start rounded-xl btn-ghost"
                        >
                          <FiPackage /> Orders
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="btn btn-sm w-full justify-start rounded-xl btn-ghost text-error"
                        >
                          <FiLogOut /> Logout
                        </button>
                        <Link
                          to="/admin"
                          className="btn btn-sm w-full rounded-xl btn-outline"
                        >
                          <FiShield /> Admin
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/auth/login"
                          className="btn btn-sm w-full rounded-xl"
                        >
                          Login
                        </Link>
                        <Link
                          to="/auth/register"
                          className="btn btn-sm w-full rounded-xl btn-outline"
                        >
                          Create account
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Orders (desktop) */}
              <Link
                to="/account/orders"
                className="hidden md:inline-flex btn btn-sm rounded-full bg-base-100 border border-base-200 shadow-sm"
              >
                <FiPackage className="text-lg" />
                <span className="hidden lg:inline">Orders</span>
              </Link>

              {/* Mobile account icon (opens drawer like Walmart) */}
              

              {/* Cart */}
              <Link
                to="/cart"
                className="btn btn-sm rounded-full bg-base-100 border border-base-200 shadow-sm relative"
                aria-label="Cart"
              >
                <FiShoppingCart className="text-xl" />

                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2">
                    <span className="badge badge-error badge-sm">
                      {cartCount}
                    </span>
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Walmart-like “fulfillment” strip placeholder (optional)
            You already have <TopUtilityBar />; this is just a spot if you want it visually inside the header.
        */}
        <div className="md:hidden border-t border-base-200/60">
          <div className="mx-auto w-full max-w-7xl px-3 py-2 flex items-center justify-between text-xs opacity-80">
            <span className="inline-flex items-center gap-2">
              <FiMapPin /> How do you want your items?
            </span>
            <span className="opacity-70">Tap to set</span>
          </div>
        </div>
      </header>
    </>
  );
}

/** Mobile Drawer (Walmart-like left slide menu) */
function MobileDrawer({
  open,
  onClose,
  user,
  initials,
  displayName,
  categories,
  onLogout,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000000]">
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />

      {/* panel */}
      <aside
        className={[
          "absolute left-0 top-0 h-full",
          "w-[84vw] max-w-[360px]",
          "bg-base-100 shadow-2xl",
          "border-r border-base-200",
          "z-[1000001]", // ✅ panel above backdrop
          "transform-gpu", // ✅ force its own layer
          "animate-[slideIn_.18s_ease-out]",
        ].join(" ")}
      >
        <style>{`
          @keyframes slideIn { from { transform: translateX(-8px); opacity:.85 } to { transform: translateX(0); opacity:1 } }
        `}</style>

        {/* header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-base-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-base-200/70 grid place-items-center">
              {user?.email ? (
                <span className="text-sm font-extrabold">{initials}</span>
              ) : (
                <FiUser className="text-xl" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-bold truncate">
                {user?.email ? displayName : "Sign in or create account"}
              </div>
              <div className="text-xs opacity-70 truncate">
                {user?.email
                  ? user.email
                  : "Save carts • Track orders • Faster checkout"}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm rounded-full"
            onClick={onClose}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* content */}
        <div className="p-3 overflow-y-auto h-[calc(100%-4rem)]">
          {!user?.email ? (
            <div className="grid gap-2 mb-3">
              <Link
                to="/auth/login"
                className="btn btn-sm rounded-full w-full"
                onClick={onClose}
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                className="btn btn-sm rounded-full w-full btn-outline"
                onClick={onClose}
              >
                Create account
              </Link>
            </div>
          ) : (
            <div className="grid gap-2 mb-3">
              <Link
                to="/my-profile"
                className="btn btn-sm rounded-full w-full btn-ghost justify-start"
                onClick={onClose}
              >
                <FiUser /> Account
              </Link>
              <Link
                to="/account/orders"
                className="btn btn-sm rounded-full w-full btn-ghost justify-start"
                onClick={onClose}
              >
                <FiPackage /> Purchase history
              </Link>
              <button
                type="button"
                className="btn btn-sm rounded-full w-full btn-ghost justify-start text-error"
                onClick={() => {
                  onLogout?.();
                  onClose?.();
                }}
              >
                <FiLogOut /> Logout
              </button>
            </div>
          )}

          <div className="divider my-2" />

          {/* Departments (collapsible) */}
          <details className="collapse collapse-arrow bg-base-100 border border-base-200 rounded-2xl">
            <summary className="collapse-title text-sm font-semibold">
              Departments
            </summary>
            <div className="collapse-content">
              <div className="space-y-1">
                {categories?.length ? (
                  categories.map((c) => (
                    <Link
                      key={c.slug || c.name}
                      to={`/category/${c.slug || ""}`}
                      onClick={onClose}
                      className="btn btn-ghost btn-sm w-full justify-start rounded-xl"
                    >
                      {c.name}
                    </Link>
                  ))
                ) : (
                  <div className="text-xs opacity-70">No categories loaded</div>
                )}
              </div>
            </div>
          </details>

          <div className="mt-3 space-y-1">
            <Link
              to="/help"
              onClick={onClose}
              className="btn btn-ghost btn-sm w-full justify-start rounded-xl"
            >
              Help
            </Link>
            <Link
              to="/contact"
              onClick={onClose}
              className="btn btn-ghost btn-sm w-full justify-start rounded-xl"
            >
              Contact
            </Link>
            <Link
              to="/store-finder"
              onClick={onClose}
              className="btn btn-ghost btn-sm w-full justify-start rounded-xl"
            >
              Store finder
            </Link>
          </div>

          <div className="divider my-2" />

          <Link
            to="/admin"
            onClick={onClose}
            className="btn btn-outline btn-sm w-full rounded-xl"
          >
            <FiShield /> Admin
          </Link>
        </div>
      </aside>
    </div>
  );
}
