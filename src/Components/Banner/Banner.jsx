// src/components/home/Banner.jsx
import React from "react";
import { Link } from "react-router-dom";
import Container from "../Container";
import heroSrc from "../../assets/Screenshot 2025-10-22 140335-Photoroom.png";
import bow from "../../assets/shape.png";
import bone from "../../assets/shape (1).png";
import scribble from "../../assets/shape (2).png";

const Banner = () => {
  return (
    <section className="bg-slate-50 py-10 md:py-16">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* LEFT: label, headline, copy, CTA, dots */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm border border-slate-200">
              <span className="text-xl">🐾</span>
              <span className="text-sm font-medium text-slate-700">
                Natural Pet Products
              </span>
            </div>

            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900">
              the <span className="text-yellow-500">Best Products</span>
              <br className="hidden sm:block" /> for Your Pets!
            </h1>

            <p className="mt-4 text-slate-600 max-w-xl">
              Very best, highest quality organic ingredients to produce our own
              range of 100% natural pet products.
            </p>

            <div className="mt-6">
              <Link
                to="/products"
                className="btn border-0 rounded-full bg-[#F8D548] hover:bg-[#e9c635] text-slate-900 font-semibold"
              >
                Explore Products
              </Link>
            </div>

            {/* slider dots */}
            <div className="mt-8 flex items-center gap-3">
              <span className="h-2 w-8 rounded-full bg-slate-900/90 inline-block" />
              <span className="h-2 w-8 rounded-full bg-slate-300 inline-block" />
              <span className="h-2 w-8 rounded-full bg-slate-300 inline-block" />
            </div>
          </div>

          {/* RIGHT: yellow card + your image + doodles */}
          <div className="relative">
            <div className="relative rounded-[28px] bg-[#EAD94C] p-4 sm:p-6 md:p-8 aspect-[16/11] md:h-[420px] shadow-lg overflow-hidden">
              {/* >>> DROP YOUR IMAGE HERE <<< */}
              {heroSrc ? (
                <img
                  src={heroSrc}
                  alt="Happy pets with products"
                  className="absolute bottom-0 inset-x-4 mx-auto max-h-[75%] object-contain drop-shadow-xl"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-slate-700/70">
                  <span className="text-sm">
                    (Add your composite image via <code>heroSrc</code>)
                  </span>
                </div>
              )}

              {/* doodles (use images instead of svg) */}
              <img
                src={bone}
                alt=""
                aria-hidden="true"
                className="absolute top-4 right-6 w-30 h-30 object-contain drop-shadow pointer-events-none select-none"
              />

              <img
                src={bow}
                alt=""
                aria-hidden="true"
                className="absolute left-7 top-1/2 -translate-y-1/2 w-30 h-30 object-contain drop-shadow pointer-events-none select-none"
              />

              <img
                src={scribble}
                alt=""
                aria-hidden="true"
                className="absolute right-4 sm:right-5 bottom-10 w-20 h-20 object-contain drop-shadow pointer-events-none select-none"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Banner;
