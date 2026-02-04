import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiShoppingCart, FiUser, FiPackage } from "react-icons/fi";
import { AuthContext } from "../../Provider/AuthProvider";
import { CartContext } from "../../Provider/CartProvider";
import { apiGet } from "../../services/api";
import MegaMenu from "./MegaMenu";
// import MegaMenu from "./MegaMenu";
import SearchBox from "./SearchBox";

export default function Header() {
  const navigate = useNavigate();
  const { user, logOut } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        // ✅ Recommended endpoint:
        // GET /api/categories -> { data: { categories:[{name,slug,subcategories:[]}] } }
        const data = await apiGet("/api/categories", { signal: ctrl.signal });
        setCategories(data?.data?.categories || []);
      } catch {
        setCategories([]);
      }
    })();
    return () => ctrl.abort();
  }, []);

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
    <header className="sticky top-0 z-50 bg-base-100/90 backdrop-blur border-b border-base-200">
      {/* Top row */}
      <div className=" px-3 md:px-5 py-3">
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
          {/* Left: Logo + Departments */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-600 via-green-600 to-lime-500" />
              <div className="hidden sm:block leading-tight">
                <div className="font-extrabold">Thornview</div>
                <div className="text-xs opacity-70 -mt-1">Grocery</div>
              </div>
            </Link>

            <div className="hidden md:block">
              <MegaMenu categories={categories} />
            </div>
          </div>

          {/* Center: Search */}
          <div className="px-1 md:px-3">
            <SearchBox />
          </div>

          {/* Right: Account / Orders / Cart */}
          <div className="flex items-center justify-end gap-2">
            {/* Mobile departments */}
            <div className="md:hidden">
              <MegaMenu categories={categories} />
            </div>

            {/* Account dropdown */}
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-sm md:btn-md rounded-full">
                <FiUser className="text-lg" />
                <span className="hidden md:inline">
                  {user?.email ? "Account" : "Login"}
                </span>
              </label>
              <div
                tabIndex={0}
                className="dropdown-content z-[80] mt-3 w-56 rounded-2xl bg-base-100 shadow-xl border border-base-200 overflow-hidden"
              >
                <div className="p-4 border-b border-base-200">
                  {user?.email ? (
                    <>
                      <div className="font-semibold line-clamp-1">
                        {user?.displayName || "Customer"}
                      </div>
                      <div className="text-xs opacity-70 line-clamp-1">{user.email}</div>
                    </>
                  ) : (
                    <div className="text-sm opacity-80">Sign in to track orders faster.</div>
                  )}
                </div>

                <div className="p-2 space-y-1">
                  {user?.email ? (
                    <>
                      <Link to="/my-profile" className="btn btn-sm w-full justify-start rounded-xl">
                        Profile
                      </Link>
                      <Link to="/account/orders" className="btn btn-sm w-full justify-start rounded-xl">
                        Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="btn btn-sm w-full justify-start rounded-xl btn-ghost"
                        type="button"
                      >
                        Logout
                      </button>
                        <Link to="/admin" className="btn btn-sm w-full rounded-xl btn-outline">
                        Admin login
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/auth/login" className="btn btn-sm w-full rounded-xl">
                        Login
                      </Link>
                      <Link to="/auth/register" className="btn btn-sm w-full rounded-xl btn-outline">
                        Create account
                      </Link>
                    
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Orders shortcut */}
            <Link to="/account/orders" className="btn btn-sm md:btn-md rounded-full">
              <FiPackage className="text-lg" />
              <span className="hidden md:inline">Orders</span>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="btn btn-sm md:btn-md rounded-full relative">
              <FiShoppingCart className="text-lg" />
              <span className="hidden md:inline">Cart</span>

              {cartCount > 0 && (
                <span className="badge badge-error badge-sm absolute -top-2 -right-2">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
