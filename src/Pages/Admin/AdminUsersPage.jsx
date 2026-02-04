import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch } from "../../services/api";
import { toast } from "react-toastify";

function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (!s) return;
    p.set(k, s);
  });
  const out = p.toString();
  return out ? `?${out}` : "";
}

function safeDate(v) {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

const ROLES = ["customer", "admin", "manager", "marketing"];
const STATUSES = ["active", "disabled"];

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [users, setUsers] = useState([]);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  async function loadUsers(signal, overrides = {}) {
    setErr("");
    setLoading(true);
    try {
      const res = await apiGet(
        `/api/admin/users${qs({
          q: overrides.q ?? q,
          role: overrides.role ?? role,
          status: overrides.status ?? status,
          page: overrides.page ?? page,
          limit: overrides.limit ?? limit,
        })}`,
        { signal }
      );

      const list = res?.data?.users || [];
      const pag = res?.data?.pagination || {};
      setUsers(Array.isArray(list) ? list : []);
      setPagination({ total: Number(pag.total || 0), pages: Number(pag.pages || 1) });
    } catch (e) {
      if (e?.name === "AbortError") return;
      setErr(e?.message || "Failed to load users");
      setUsers([]);
      setPagination({ total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    loadUsers(ctrl.signal, { page: 1 });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, status, limit]);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setPage(1);
      loadUsers(ctrl.signal, { page: 1 });
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    const ctrl = new AbortController();
    loadUsers(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function patchUser(id, patch) {
    const prev = users;

    // ✅ optimistic update
    setUsers((list) =>
      list.map((u) => (String(u._id) === String(id) ? { ...u, ...patch } : u))
    );

    try {
      const res = await apiPatch(`/api/admin/users/${id}`, patch);
      const updated = res?.data?.user;

      if (updated?._id) {
        setUsers((list) => list.map((u) => (String(u._id) === String(updated._id) ? updated : u)));
      }

      toast.success("User updated");

      // ✅ background sync
      const ctrl = new AbortController();
      loadUsers(ctrl.signal);
    } catch (e) {
      setUsers(prev); // rollback
      toast.error(e?.message || "Update failed");
    }
  }

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      const ad = new Date(a?.createdAt || 0).getTime();
      const bd = new Date(b?.createdAt || 0).getTime();
      return bd - ad;
    });
  }, [users]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Admin Users</h1>
          <p className="text-sm text-slate-500 mt-1">Manage roles and statuses.</p>
        </div>

        <button
          className={`btn btn-sm ${loading ? "btn-disabled" : ""}`}
          onClick={() => {
            const ctrl = new AbortController();
            loadUsers(ctrl.signal);
            toast.info("Refreshing users…");
          }}
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="input input-bordered md:col-span-2"
            placeholder="Search by email/name/firebaseUid…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select className="select select-bordered" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select className="select select-bordered" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Page {page}/{pagination.pages} — Total: {pagination.total}
          </div>

          <div className="flex items-center gap-2">
            <select
              className="select select-bordered select-sm"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>

            <button className="btn btn-sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Prev
            </button>
            <button
              className="btn btn-sm"
              disabled={page >= pagination.pages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {err ? (
        <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 p-4">
          <div className="font-bold text-error">Could not load users</div>
          <div className="text-sm text-slate-500 mt-1">{err}</div>
        </div>
      ) : null}

      {/* Table */}
      <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last login</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5}>
                      <div className="skeleton h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : sorted.length ? (
                sorted.map((u) => (
                  <tr key={String(u._id)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-10 rounded-full bg-base-200 overflow-hidden">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name || u.email} />
                            ) : null}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold line-clamp-1">{u.name || "—"}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{u.email || "—"}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <select
                        className="select select-bordered select-sm"
                        value={u.role || "customer"}
                        onChange={(e) => patchUser(u._id, { role: e.target.value })}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <select
                        className="select select-bordered select-sm"
                        value={u.status || "active"}
                        onChange={(e) => patchUser(u._id, { status: e.target.value })}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="text-xs text-slate-500">{safeDate(u.createdAt)}</td>
                    <td className="text-xs text-slate-500">{safeDate(u.lastLoginAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 py-8">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
