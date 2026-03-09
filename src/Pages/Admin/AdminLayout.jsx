import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  FiGrid,
  FiShoppingBag,
  FiBox,
  FiUsers,
  FiMessageSquare,
  FiChevronRight,
} from "react-icons/fi";
import logo from "../../assets/logo.png";

function SideLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      end={to === "/admin"}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3 rounded-2xl px-3.5 py-3",
          "transition-all duration-200 border",
          isActive
            ? "bg-base-100/75 backdrop-blur border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
            : "border-transparent hover:bg-base-100/45 hover:backdrop-blur hover:border-white/10",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              "grid h-10 w-10 place-items-center rounded-2xl text-base shadow-sm transition-all",
              isActive
                ? "bg-primary/12 text-primary border border-primary/10"
                : "bg-base-100/60 text-base-content/70 border border-white/10 group-hover:text-base-content",
            ].join(" ")}
          >
            {icon}
          </span>

          <div className="flex-1 min-w-0">
            <div
              className={[
                "font-semibold",
                isActive ? "text-base-content" : "text-base-content/80",
              ].join(" ")}
            >
              {children}
            </div>
          </div>

          <FiChevronRight
            className={[
              "text-sm transition-transform duration-200",
              isActive
                ? "opacity-100 text-primary"
                : "opacity-0 -translate-x-1 group-hover:opacity-70 group-hover:translate-x-0",
            ].join(" ")}
          />
        </>
      )}
    </NavLink>
  );
}

export default function AdminLayout() {
  return (
    <>
      <style>{`
        .admin-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(148,163,184,.35) transparent;
        }
        .admin-scroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .admin-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .admin-scroll::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,.28);
          border: 2px solid transparent;
          background-clip: padding-box;
          border-radius: 999px;
        }
        .admin-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(148,163,184,.42);
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      `}</style>

      {/* 
        Adjust 96px if your sticky header height is different
      */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 md:gap-6 xl:h-[calc(100vh-96px)] xl:min-h-0">
        {/* Sidebar */}
        <aside className="xl:col-span-3 min-w-0 xl:min-h-0">
          <div className="relative rounded-[28px] border border-white/10 bg-base-100/55 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,0.10)] xl:h-full xl:overflow-hidden">
            {/* glow */}
            <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-6 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-white/[0.03]" />

            <div className="relative p-4 md:p-5 xl:h-full xl:min-h-0 flex flex-col">
              {/* Logo */}
              <Link
                to="/"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-base-100/45 px-3.5 py-3 shadow-sm backdrop-blur shrink-0"
              >
                <img
                  src={logo}
                  alt="Thornview"
                  className="w-10 h-10 rounded-2xl object-cover ring-1 ring-white/10"
                />
                <div className="min-w-0">
                  <div className="font-extrabold tracking-tight leading-tight">
                    Thornview
                  </div>
                  <div className="text-[11px] opacity-65 -mt-0.5">
                    Grocery Admin
                  </div>
                </div>
              </Link>

              {/* Heading */}
              <div className="mt-5 shrink-0">
                <div className="text-xs uppercase tracking-[0.18em] opacity-50 font-semibold px-1">
                  Control Panel
                </div>
              </div>

              {/* Scrollable sidebar content */}
              <div className="mt-3 xl:flex-1 xl:min-h-0 xl:overflow-y-auto xl:pr-1 admin-scroll">
                <div className="flex flex-col gap-2">
                  <SideLink to="/admin" icon={<FiGrid />}>
                    Dashboard
                  </SideLink>

                  <SideLink to="/admin/orders" icon={<FiShoppingBag />}>
                    Orders
                  </SideLink>

                  <SideLink to="/admin/products" icon={<FiBox />}>
                    Products
                  </SideLink>

                  <SideLink to="/admin/users" icon={<FiUsers />}>
                    Users
                  </SideLink>

                  <SideLink to="/admin/live-chat" icon={<FiMessageSquare />}>
                    Live Chat
                  </SideLink>
                </div>

                <div className="pt-5">
                  <div className="rounded-2xl border border-white/10 bg-base-100/40 p-3.5 text-xs opacity-70 backdrop-blur">
                    Manage orders, products, users, and customer conversations
                    from one place.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="xl:col-span-9 min-w-0 xl:min-h-0">
          <div className="rounded-[28px] border border-white/10 bg-base-100/35 backdrop-blur-xl shadow-[0_14px_40px_rgba(0,0,0,0.06)] xl:h-full xl:overflow-hidden">
            <div className="p-3 md:p-4 xl:h-full xl:min-h-0 xl:overflow-y-auto admin-scroll">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}