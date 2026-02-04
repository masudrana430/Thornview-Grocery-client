import React from "react";
import { Link } from "react-router-dom";

export default function SectionHeader({ title, viewAllHref, rightText = "View all" }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg md:text-xl font-extrabold">{title}</h2>
      {viewAllHref ? (
        <Link to={viewAllHref} className="link link-hover text-sm">
          {rightText}
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
