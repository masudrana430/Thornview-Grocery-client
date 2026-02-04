import React, { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../services/api";
import { toast } from "react-toastify";

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

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

export default function AdminProductsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // create/edit modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct());

  function resetForm() {
    setEditing(null);
    setForm(emptyProduct());
  }

  async function loadProducts(signal, overrides = {}) {
    setErr("");
    setLoading(true);
    try {
      const res = await apiGet(
        `/api/admin/products${qs({
          q: overrides.q ?? q,
          page: overrides.page ?? page,
          limit: overrides.limit ?? limit,
        })}`,
        { signal }
      );
      const list = res?.data?.items || [];
      const pag = res?.data?.pagination || {};
      setItems(Array.isArray(list) ? list : []);
      setPagination({ total: Number(pag.total || 0), pages: Number(pag.pages || 1) });
    } catch (e) {
      if (e?.name === "AbortError") return;
      setErr(e?.message || "Failed to load products");
      setItems([]);
      setPagination({ total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  }

  // initial + pagination
  useEffect(() => {
    const ctrl = new AbortController();
    loadProducts(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // debounce search
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setPage(1);
      loadProducts(ctrl.signal, { page: 1 });
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const title = useMemo(() => (editing ? "Edit Product" : "Add Product"), [editing]);

  async function createProduct() {
    try {
      const payload = normalizeProduct(form);
      const res = await apiPost("/api/admin/products", payload);

      const created = res?.data?.product;
      if (!created?._id) throw new Error("Product created but missing id.");

      // ✅ optimistic add
      setItems((list) => [created, ...list]);
      toast.success("Product created");

      setOpen(false);
      resetForm();

      // ✅ background sync
      const ctrl = new AbortController();
      loadProducts(ctrl.signal);
    } catch (e) {
      toast.error(e?.message || "Create failed");
    }
  }

  async function updateProduct() {
    try {
      if (!editing?._id) return;

      const payload = normalizeProduct(form);
      const res = await apiPatch(`/api/admin/products/${editing._id}`, payload);

      const updated = res?.data?.product;
      if (!updated?._id) throw new Error("Update succeeded but missing product.");

      // ✅ optimistic replace
      setItems((list) => list.map((p) => (String(p._id) === String(updated._id) ? updated : p)));
      toast.success("Product updated");

      setOpen(false);
      resetForm();

      // ✅ background sync
      const ctrl = new AbortController();
      loadProducts(ctrl.signal);
    } catch (e) {
      toast.error(e?.message || "Update failed");
    }
  }

  async function deleteProduct(id) {
    const prev = items;

    // ✅ optimistic remove
    setItems((list) => list.filter((p) => String(p._id) !== String(id)));

    try {
      await apiDelete(`/api/admin/products/${id}`);
      toast.success("Product deleted");

      // ✅ background sync
      const ctrl = new AbortController();
      loadProducts(ctrl.signal);
    } catch (e) {
      setItems(prev); // rollback
      toast.error(e?.message || "Delete failed");
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Admin Products</h1>
          <p className="text-sm text-slate-500 mt-1">Create, edit, and delete products.</p>
        </div>

        <div className="flex gap-2">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            + Add product
          </button>

          <button
            className={`btn btn-sm ${loading ? "btn-disabled" : ""}`}
            onClick={() => {
              const ctrl = new AbortController();
              loadProducts(ctrl.signal);
              toast.info("Refreshing products…");
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search & paging */}
      <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="input input-bordered md:col-span-2"
            placeholder="Search name, brand, slug, category…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="flex gap-2">
            <select className="select select-bordered w-full" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Page {page}/{pagination.pages} — Total: {pagination.total}
          </div>
          <div className="flex gap-2">
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
          <div className="font-bold text-error">Could not load products</div>
          <div className="text-sm text-slate-500 mt-1">{err}</div>
        </div>
      ) : null}

      {/* list */}
      <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}>
                      <div className="skeleton h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : items.length ? (
                items.map((p) => (
                  <tr key={String(p._id)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-base-200 overflow-hidden">
                          {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : null}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold line-clamp-1">{p.name}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{p.categorySlug || "—"}</td>
                    <td className="text-sm">{p.brand || "—"}</td>
                    <td className="font-bold">৳{safeNum(p.price).toLocaleString()}</td>
                    <td className="text-sm">{p.inStock === false ? "Out" : "In"}</td>
                    <td className="text-right space-x-2">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          setEditing(p);
                          setForm(fromProduct(p));
                          setOpen(true);
                        }}
                      >
                        Edit
                      </button>

                      <button className="btn btn-sm btn-error" onClick={() => deleteProduct(p._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-8">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* modal */}
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-base-200 bg-base-100 p-5">
            <div className="flex items-center justify-between">
              <div className="font-black text-lg">{title}</div>
              <button
                className="btn btn-sm"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input input-bordered" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input input-bordered" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />

              <input className="input input-bordered" placeholder="Category slug" value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })} />
              <input className="input input-bordered" placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />

              <input className="input input-bordered" placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />

              <input
                className="input input-bordered"
                placeholder="Price"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />

              <input
                className="input input-bordered"
                placeholder="Old price (optional)"
                type="number"
                value={form.oldPrice}
                onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
              />

              <input
                className="input input-bordered md:col-span-2"
                placeholder="Tags (comma separated) e.g. halal, vegan"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />

              <label className="label cursor-pointer md:col-span-2 justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={!!form.inStock}
                  onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                />
                <span className="label-text">In stock</span>
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="btn"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={() => {
                  if (editing) return updateProduct();
                  return createProduct();
                }}
              >
                {editing ? "Save changes" : "Create product"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function emptyProduct() {
  return {
    name: "",
    slug: "",
    brand: "",
    categorySlug: "",
    image: "",
    price: "",
    oldPrice: "",
    tags: "",
    inStock: true,
  };
}

function normalizeProduct(form) {
  return {
    name: String(form.name || "").trim(),
    slug: String(form.slug || "").trim(),
    brand: String(form.brand || "").trim(),
    categorySlug: String(form.categorySlug || "").trim(),
    image: String(form.image || "").trim(),
    price: safeNum(form.price),
    oldPrice: form.oldPrice === "" || form.oldPrice == null ? null : safeNum(form.oldPrice),
    tags: String(form.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    inStock: !!form.inStock,
  };
}

function fromProduct(p) {
  return {
    name: p?.name || "",
    slug: p?.slug || "",
    brand: p?.brand || "",
    categorySlug: p?.categorySlug || "",
    image: p?.image || "",
    price: String(p?.price ?? ""),
    oldPrice: p?.oldPrice == null ? "" : String(p?.oldPrice),
    tags: Array.isArray(p?.tags) ? p.tags.join(", ") : "",
    inStock: p?.inStock !== false,
  };
}
