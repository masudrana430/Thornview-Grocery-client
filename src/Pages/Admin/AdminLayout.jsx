import React from "react";
import { NavLink, Outlet } from "react-router-dom";

function SideLink({ to, children }) {
  return (
    <NavLink
      to={to}
      end={to === "/admin"}
      className={({ isActive }) =>
        [
          "px-3 py-2 rounded-xl font-semibold",
          isActive ? "bg-base-200" : "hover:bg-base-200/60",
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
      <aside className="lg:col-span-3">
        <div className="rounded-2xl border border-base-200 bg-base-100 p-4 sticky top-[90px]">
          <div className="font-black text-lg">Admin</div>

          <div className="mt-3 flex flex-col gap-1">
            <SideLink to="/admin">Dashboard</SideLink>
            <SideLink to="/admin/orders">Orders</SideLink>
            <SideLink to="/admin/products">Products</SideLink>
            <SideLink to="/admin/users">Users</SideLink>
            <SideLink to="/admin/live-chat">Live Chat</SideLink>

          </div>
        </div>
      </aside>

      <main className="lg:col-span-9">
        <Outlet />
      </main>
    </div>
  );
}
