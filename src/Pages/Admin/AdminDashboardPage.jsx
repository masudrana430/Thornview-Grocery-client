import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../services/api";
import { toast } from "react-toastify";
import logo from "../../assets/logo.png";
import {
  FiRefreshCw,
  FiUsers,
  FiBox,
  FiShoppingBag,
  FiCreditCard,
  FiAlertCircle,
  FiTrendingUp,
  FiClock,
  FiPackage,
  FiArrowRight,
  FiActivity,
  FiShield,
  FiMessageSquare,
} from "react-icons/fi";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

function moneyBDT(n) {
  return `৳${Number(n || 0).toLocaleString()}`;
}

// function statusTone(status = "") {
//   const s = String(status).toLowerCase();
//   if (["delivered", "paid", "completed"].includes(s)) {
//     return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
//   }
//   if (["pending", "processing"].includes(s)) {
//     return "bg-amber-500/10 text-amber-600 border-amber-500/20";
//   }
//   if (["cancelled", "failed", "refunded"].includes(s)) {
//     return "bg-rose-500/10 text-rose-600 border-rose-500/20";
//   }
//   return "bg-sky-500/10 text-sky-600 border-sky-500/20";
// }

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [overview, setOverview] = useState(null);

  async function loadOverview(signal) {
    setErr("");
    setLoading(true);
    try {
      const res = await apiGet("/api/admin/overview", { signal });
      setOverview(res?.data || null);
    } catch (e) {
      if (e?.name === "AbortError") return;
      setErr(e?.message || "Failed to load overview");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    loadOverview(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  const totals = overview?.totals || {};
  const byStatus = Array.isArray(overview?.byStatus) ? overview.byStatus : [];

  const topStatuses = useMemo(() => [...byStatus].slice(0, 8), [byStatus]);

  function GlassTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    return (
      <div className="rounded-2xl border border-white/10 bg-base-100/75 backdrop-blur-2xl px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
        <div className="text-xs uppercase tracking-wide opacity-60">
          {label}
        </div>
        <div className="mt-1 text-sm font-semibold">
          Orders: <span className="font-black">{payload[0]?.value ?? 0}</span>
        </div>
      </div>
    );
  }

  // const maxStatusCount = useMemo(() => {
  //   if (!topStatuses.length) return 1;
  //   return Math.max(...topStatuses.map((s) => Number(s.count || 0)), 1);
  // }, [topStatuses]);

  const paidRate = useMemo(() => {
    const totalOrders = Number(totals.orders || 0);
    if (!totalOrders) return 0;
    return Math.round((Number(totals.paidOrders || 0) / totalOrders) * 100);
  }, [totals]);

  const unpaidRate = useMemo(() => {
    const totalOrders = Number(totals.orders || 0);
    if (!totalOrders) return 0;
    return Math.round((Number(totals.unpaidOrders || 0) / totalOrders) * 100);
  }, [totals]);

  const statusChartData = useMemo(() => {
    return topStatuses.map((item) => ({
      name: String(item.status || "Unknown"),
      count: Number(item.count || 0),
    }));
  }, [topStatuses]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header / Hero */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-base-100/60 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.12)]">
        <div className="absolute inset-0 pointer-events-none bg-white/[0.03]" />
        <div className="absolute -top-24 right-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="relative p-5 md:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <Link
                to="/"
                className="shrink-0 rounded-3xl border border-white/10 bg-base-100/60 p-2.5 shadow-sm backdrop-blur"
              >
                <img
                  src={logo}
                  alt="Thornview"
                  className="w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover"
                />
              </Link>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-base-100/50 px-3 py-1.5 text-xs font-semibold shadow-sm">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  Thornview Admin Panel
                </div>

                <h1 className="mt-3 text-2xl md:text-3xl font-black tracking-tight">
                  Admin Dashboard
                </h1>

                <p className="mt-2 text-sm opacity-70 max-w-2xl">
                  Monitor store performance, orders, payments, inventory
                  activity, and operational health.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/admin/orders"
                className="btn btn-sm md:btn-md rounded-full bg-base-100/70 border border-white/10 shadow-sm"
              >
                Orders
              </Link>

              <button
                className={`btn btn-sm md:btn-md rounded-full ${
                  loading ? "btn-disabled" : ""
                }`}
                onClick={() => {
                  const ctrl = new AbortController();
                  loadOverview(ctrl.signal);
                  toast.info("Refreshing dashboard…");
                }}
                type="button"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {err ? (
            <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
              <div className="font-bold text-rose-600">
                Could not load dashboard
              </div>
              <div className="text-sm opacity-70 mt-1">{err}</div>
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[24px] border border-white/10 bg-base-100/60 backdrop-blur-xl p-5 shadow-sm"
            >
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-8 w-32 mt-4" />
              <div className="skeleton h-3 w-20 mt-4" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && overview ? (
        <>
          {/* KPI Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total users"
              value={totals.users}
              icon={<FiUsers />}
              note="Registered customers & staff"
            />
            <StatCard
              title="Products"
              value={totals.products}
              icon={<FiBox />}
              note="Catalog currently available"
            />
            <StatCard
              title="Orders"
              value={totals.orders}
              icon={<FiShoppingBag />}
              note="All order records"
            />
            <StatCard
              title="Revenue"
              value={moneyBDT(totals.revenue)}
              icon={<FiTrendingUp />}
              note="Total earned revenue"
              highlight
            />
            <StatCard
              title="Paid orders"
              value={totals.paidOrders}
              icon={<FiCreditCard />}
              note={`${paidRate}% of total orders`}
            />
            <StatCard
              title="Unpaid orders"
              value={totals.unpaidOrders}
              icon={<FiAlertCircle />}
              note={`${unpaidRate}% awaiting payment`}
            />
            <StatCard
              title="Operations"
              value="Stable"
              icon={<FiActivity />}
              note="Dashboard synced successfully"
            />
            <StatCard
              title="Security"
              value="Protected"
              icon={<FiShield />}
              note="Admin routes active"
            />
          </div>

          {/* Main dashboard area */}
          <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Chart / status analytics */}
            <div className="xl:col-span-7 rounded-[28px] border border-white/10 bg-base-100/60 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.10)] p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg md:text-xl font-black">
                    Orders by status
                  </h2>
                  <p className="text-sm opacity-70 mt-1">
                    Distribution of current order pipeline.
                  </p>
                </div>

                <Link
                  to="/admin/orders"
                  className="btn btn-sm rounded-full bg-base-100/70 border border-white/10"
                >
                  View all <FiArrowRight />
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-base-100/45 px-3 py-1 text-xs backdrop-blur">
                  Delivered / Paid
                </span>
                <span className="rounded-full border border-white/10 bg-base-100/45 px-3 py-1 text-xs backdrop-blur">
                  Pending / Processing
                </span>
                <span className="rounded-full border border-white/10 bg-base-100/45 px-3 py-1 text-xs backdrop-blur">
                  Cancelled / Failed
                </span>
              </div>

              <div className="mt-6 relative overflow-hidden rounded-[28px] border border-white/10 bg-base-100/35 backdrop-blur-2xl p-4 md:p-5 shadow-[0_16px_50px_rgba(0,0,0,0.10)]">
                {/* glass glow layers */}
                <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />
                <div className="pointer-events-none absolute inset-0 bg-white/[0.03]" />

                <div className="relative h-[320px]">
                  {statusChartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={statusChartData}
                        barCategoryGap={18}
                        margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="4 8"
                          stroke="rgba(148,163,184,0.18)"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: "rgba(100,116,139,0.9)" }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 12, fill: "rgba(100,116,139,0.9)" }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.04)" }}
                          content={<GlassTooltip />}
                        />

                        <Bar
                          dataKey="count"
                          radius={[14, 14, 6, 6]}
                          stroke="rgba(255,255,255,0.22)"
                          strokeWidth={1}
                        >
                          {statusChartData.map((entry, index) => {
                            const name = String(entry.name || "").toLowerCase();

                            let fill = "rgba(59,130,246,0.72)";
                            if (
                              ["delivered", "paid", "completed"].includes(name)
                            ) {
                              fill = "rgba(16,185,129,0.72)";
                            } else if (
                              ["pending", "processing"].includes(name)
                            ) {
                              fill = "rgba(245,158,11,0.72)";
                            } else if (
                              ["cancelled", "failed", "refunded"].includes(name)
                            ) {
                              fill = "rgba(244,63,94,0.72)";
                            }

                            return <Cell key={`cell-${index}`} fill={fill} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full grid place-items-center text-sm opacity-70">
                      No status data yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MiniInsight
                  label="Paid rate"
                  value={`${paidRate}%`}
                  helper="Healthy payment conversion"
                />
                <MiniInsight
                  label="Unpaid rate"
                  value={`${unpaidRate}%`}
                  helper="Needs payment follow-up"
                />
                <MiniInsight
                  label="Revenue"
                  value={moneyBDT(totals.revenue)}
                  helper="Current total earnings"
                />
              </div>
            </div>

            {/* Right side panels */}
            <div className="xl:col-span-5 grid grid-cols-1 gap-4">
              <div className="rounded-[28px] border border-white/10 bg-base-100/60 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.10)] p-5 md:p-6">
                <h2 className="text-lg font-black">Quick actions</h2>
                <p className="text-sm opacity-70 mt-1">
                  Frequently used admin tasks.
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <QuickLink
                    to="/admin/orders"
                    title="Manage Orders"
                    subtitle="Track, update, and fulfill"
                    icon={<FiPackage />}
                  />
                  <QuickLink
                    to="/admin/products"
                    title="Manage Products"
                    subtitle="Edit stock and catalog"
                    icon={<FiBox />}
                  />
                  <QuickLink
                    to="/admin/users"
                    title="Manage Users"
                    subtitle="Roles and account control"
                    icon={<FiUsers />}
                  />
                  <div className="rounded-2xl border border-white/10 bg-base-100/50 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <FiMessageSquare className="text-lg" />
                      </div>
                      <div>
                        <div className="font-semibold">Support / Chat</div>
                        <div className="text-xs opacity-70">
                          Live assistance module ready
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-base-100/60 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.10)] p-5 md:p-6">
                <h2 className="text-lg font-black">Store insights</h2>
                <p className="text-sm opacity-70 mt-1">
                  Quick operational reading for e-commerce performance.
                </p>

                <div className="mt-5 space-y-4">
                  <InsightRow
                    icon={<FiClock />}
                    title="Order pipeline"
                    desc={
                      totals.orders
                        ? `${totals.orders} total orders currently tracked in the system.`
                        : "No order activity yet."
                    }
                  />
                  <InsightRow
                    icon={<FiCreditCard />}
                    title="Payments"
                    desc={
                      totals.paidOrders
                        ? `${totals.paidOrders} orders are already paid.`
                        : "No paid orders recorded yet."
                    }
                  />
                  <InsightRow
                    icon={<FiTrendingUp />}
                    title="Revenue performance"
                    desc={`Current tracked revenue is ${moneyBDT(
                      totals.revenue,
                    )}.`}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ title, value, icon, note, highlight = false }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[24px] border border-white/10",
        "bg-base-100/60 backdrop-blur-2xl",
        "shadow-[0_12px_40px_rgba(0,0,0,0.08)]",
        "p-5",
      ].join(" ")}
    >
      <div className="absolute inset-0 pointer-events-none bg-white/[0.02]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-sm opacity-70">{title}</div>
          <div
            className={[
              "mt-2 text-3xl font-black tracking-tight",
              highlight ? "text-primary" : "",
            ].join(" ")}
          >
            {value ?? 0}
          </div>
          <div className="mt-2 text-xs opacity-60">{note}</div>
        </div>

        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-base-100/70 border border-white/10 shadow-sm text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, title, subtitle, icon }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-white/10 bg-base-100/50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="font-semibold">{title}</div>
          <div className="text-xs opacity-70 mt-1">{subtitle}</div>
        </div>
      </div>
    </Link>
  );
}

function MiniInsight({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-base-100/50 p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide opacity-60">{label}</div>
      <div className="text-xl font-black mt-1">{value}</div>
      <div className="text-xs opacity-70 mt-1">{helper}</div>
    </div>
  );
}

function InsightRow({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-base-100/70 border border-white/10 shadow-sm">
        {icon}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm opacity-70 mt-1">{desc}</div>
      </div>
    </div>
  );
}
