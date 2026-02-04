import React from "react";
import { Link } from "react-router-dom";

export default function MegaMenu({ categories = [] }) {
  return (
    <div className="dropdown dropdown-start">
      <label
        tabIndex={0}
        className="btn btn-sm md:btn-md rounded-full bg-base-100 border border-base-300 hover:bg-base-200"
      >
        Departments
      </label>

      {/* Mega Panel */}
      <div
        tabIndex={0}
        className="dropdown-content z-[60] mt-3 w-[92vw] max-w-5xl rounded-3xl bg-base-100 shadow-2xl border border-base-200"
      >
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-bold">Shop by Department</h3>
            <Link to="/shop" className="link link-hover text-sm">
              View all
            </Link>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div key={cat._id || cat.slug || cat.name} className="rounded-2xl p-3 hover:bg-base-200">
                <Link
                  to={`/c/${cat.slug || cat.name}`}
                  className="font-semibold hover:underline block"
                >
                  {cat.name}
                </Link>

                {Array.isArray(cat.subcategories) && cat.subcategories.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm opacity-90">
                    {cat.subcategories.slice(0, 8).map((sub) => (
                      <li key={sub.slug || sub.name}>
                        <Link
                          to={`/c/${cat.slug || cat.name}/${sub.slug || sub.name}`}
                          className="hover:underline"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {categories.length === 0 && (
              <div className="text-sm text-slate-500">
                No categories yet. Add an endpoint: <code>/api/categories</code>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
