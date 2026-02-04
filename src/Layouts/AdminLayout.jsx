// src/Layouts/AdminLayout.jsx
import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "btn btn-sm justify-start w-full",
          isActive ? "btn-primary" : "btn-ghost",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

export default function AdminLayout() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar */}
      <aside className="lg:col-span-3">
        <div className="rounded-2xl border border-base-200 bg-base-100 p-4 sticky top-[90px]">
          <div className="font-black text-lg">Admin</div>
          <div className="text-xs text-slate-500 mt-1">Manage store</div>

          <div className="mt-4 space-y-2">
            <NavItem to="/admin">Overview</NavItem>
            {/* next pages later */}
            {/* <NavItem to="/admin/orders">Orders</NavItem>
            <NavItem to="/admin/products">Products</NavItem>
            <NavItem to="/admin/users">Users</NavItem> */}
          </div>

          <div className="mt-4 border-t border-base-200 pt-3">
            <Link className="btn btn-sm w-full" to="/">
              Back to shop
            </Link>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:col-span-9">
        <Outlet />
      </main>
    </div>
  );
}
