import React from "react";
import { Link } from "react-router-dom";

export default function SupportBanner() {
  return (
    <section>
      <div className="rounded-3xl overflow-hidden border border-base-200 bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 text-white">
        <div className="p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center font-extrabold">
              ❤
            </div>
            <div>
              <div className="font-extrabold text-lg leading-tight">Your support matters</div>
              <div className="text-sm text-white/85">
                Donate to support local community & hospitals.
              </div>
            </div>
          </div>

          <Link
            to="/contact"
            className="btn btn-sm rounded-full bg-white text-black border-0"
          >
            Learn more
          </Link>
        </div>
      </div>
    </section>
  );
}
