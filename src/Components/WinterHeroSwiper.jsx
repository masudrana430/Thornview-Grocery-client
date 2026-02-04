import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  Pagination,
  Navigation,
  A11y,
  EffectFade,
} from "swiper/modules";
import { motion as Motion } from "framer-motion";

import Lottie from "lottie-react";
import Camera from "./../animation/Animation - 1725453367680.json";
import Earth from "./../animation/blood donner.json";
import Report from "./../animation/heart beat pulse.json";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import Container from "./Container";

const textContainer = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: "easeOut",
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const textItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const rightCard = {
  hidden: { opacity: 0, scale: 0.96, y: 18 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const WinterHeroSwiper = ({ slides = [] }) => {
  const [active, setActive] = useState(0);

  const data = slides.length
    ? slides
    : [
        {
          title: "Donate Blood, Save Lives",
          subtitle:
            "Join thousands of registered donors and give patients a second chance at life.",
          badge: "Lifesaving Network",
        },
        {
          title: "Find a Donor in Minutes",
          subtitle:
            "Search by blood group, district, and upazila to get help from nearby donors fast.",
          badge: "Smart Matching",
        },
        {
          title: "Organize Every Request",
          subtitle:
            "Create, track, and update blood requests from a clean, powerful dashboard.",
          badge: "Request Management",
        },
      ];

  return (
    <Container>
    <section className="relative py-10 md:py-16 overflow-hidden">
      {/* soft background glows */}
      {/* <div className="pointer-events-none absolute -left-24 -top-16 h-72 w-72 bg-rose-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 bg-sky-300/40 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-1/4 bottom-[-6rem] h-64 bg-red-200/30 blur-3xl" /> */}

      <div className=" px-4 sm:px-6 lg:px-8">
        <Swiper
          modules={[Autoplay, Pagination, Navigation, A11y, EffectFade]}
          slidesPerView={1}
          loop
          effect="fade"
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          onSwiper={(sw) => setActive(sw.realIndex)}
          onSlideChange={(sw) => setActive(sw.realIndex)}
          className="hero-swiper rounded-[32px] bg-white/80 backdrop-blur-xl shadow-2xl border border-white/60 overflow-hidden"
        >
          {data.map((s, i) => {
            const isActive = active === i;
            return (
              <SwiperSlide key={i}>
                <div className="relative grid grid-cols-1 md:grid-cols-2 items-stretch">
                  {/* LEFT: text & actions */}
                  <Motion.div
                    className="p-7 sm:p-10 lg:p-12 flex flex-col justify-center"
                    variants={textContainer}
                    initial="hidden"
                    animate={isActive ? "show" : "hidden"}
                  >
                    <Motion.div
                      variants={textItem}
                      className="inline-flex items-center gap-2 rounded-full bg-red-100 text-red-800 px-3 py-1 text-xs font-semibold tracking-wide uppercase"
                    >
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span>{s.badge || "BloodCare Platform"}</span>
                    </Motion.div>

                    <Motion.h1
                      variants={textItem}
                      className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-slate-900"
                    >
                      {s.title}
                    </Motion.h1>

                    <Motion.p
                      variants={textItem}
                      className="mt-3 text-slate-600 max-w-xl text-sm sm:text-base"
                    >
                      {s.subtitle}
                    </Motion.p>

                    {/* CTAs */}
                    <Motion.div
                      variants={textItem}
                      className="mt-6 flex flex-wrap gap-3"
                    >
                      <Motion.div
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Link
                          to="/auth/register"
                          className="
                            inline-flex items-center gap-2
                            rounded-full px-6 py-2.5
                            bg-gradient-to-r from-[#DC2626] via-[#EA384D] to-[#F97316]
                            text-sm sm:text-base font-semibold text-white
                            shadow-lg shadow-red-300/60
                            transition
                            hover:shadow-red-400/80
                          "
                        >
                          Join as a donor
                          <span className="text-lg leading-none">→</span>
                        </Link>
                      </Motion.div>

                      <Motion.div
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Link
                          to="/search-donors"
                          className="
                            inline-flex items-center gap-2
                            rounded-full px-5 py-2.5
                            border border-red-300/80
                            text-sm sm:text-base font-medium
                            text-[#B91C1C]
                            bg-white
                            hover:bg-red-50
                            transition
                          "
                        >
                          Search donors
                        </Link>
                      </Motion.div>
                    </Motion.div>

                    {/* small trust strip */}
                    <Motion.div
                      variants={textItem}
                      className="mt-6 flex flex-wrap gap-4 text-xs sm:text-sm text-slate-500"
                    >
                      <div className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        10k+ registered donors
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-sky-400" />
                        Real-time request tracking
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        Secure donor profiles
                      </div>
                    </Motion.div>
                  </Motion.div>

                  {/* RIGHT: visual card */}
                  <Motion.div
                    className="relative h-[280px] sm:h-[320px] md:h-[420px]"
                    variants={rightCard}
                    initial="hidden"
                    animate={isActive ? "show" : "hidden"}
                  >
                    <div className="absolute inset-5 md:inset-6 rounded-[28px] bg-gradient-to-br from-[#DC2626] via-[#BE123C] to-[#312E81] shadow-xl overflow-hidden">
                      {/* subtle glass highlight */}
                      <div className="absolute inset-x-[-20%] -top-10 h-32 bg-white/15 blur-3xl" />

                      {/* MAIN ILLUSTRATION PLACEHOLDER */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {s.img ? (
                          <Motion.img
                            src={s.img}
                            alt=""
                            className="max-h-[80%] object-contain drop-shadow-2xl"
                            initial={{ opacity: 0, y: 18 }}
                            animate={
                              isActive
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: 18 }
                            }
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            whileHover={{ scale: 1.02 }}
                          />
                        ) : (
                          <div className="text-center text-rose-50/90 text-sm sm:text-base px-6">
                            <p className="font-semibold">Every drop counts.</p>
                            <p className="mt-1 text-xs sm:text-sm text-rose-100/90">
                              Visualize live donation requests, donor matches,
                              and successful transfusions in a single view.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* decorative Lottie elements */}
                      <Lottie
                        animationData={Camera}
                        loop
                        className="absolute -top-2 right-3 w-16 h-16 md:w-20 md:h-20 opacity-80 drop-shadow-lg pointer-events-none select-none"
                      />
                      <Lottie
                        animationData={Earth}
                        loop
                        className="absolute left-2 top-1/3 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 opacity-80 drop-shadow-lg pointer-events-none select-none"
                      />
                      <Lottie
                        animationData={Report}
                        loop
                        className="absolute right-2 bottom-0 w-16 h-16 md:w-20 md:h-20 opacity-80 drop-shadow-lg pointer-events-none select-none"
                      />

                      {/* floating particles */}
                      <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        {[...Array(22)].map((_, k) => (
                          <span
                            key={k}
                            className="absolute bg-white/80 rounded-full animate-fall"
                            style={{
                              left: `${Math.random() * 100}%`,
                              width: `${Math.random() * 4 + 2}px`,
                              height: `${Math.random() * 4 + 2}px`,
                              animationDelay: `${Math.random() * 4}s`,
                              animationDuration: `${Math.random() * 6 + 6}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </Motion.div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10%); opacity: .9; }
          100% { transform: translateY(110%); opacity: .9; }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        /* Swiper overrides */
        .hero-swiper .swiper-pagination-bullet {
          background: #e5e7eb;
          opacity: 1;
          transition: all 0.25s ease;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: #dc2626;
          width: 26px;
          border-radius: 9999px;
        }
        .hero-swiper .swiper-button-next,
        .hero-swiper .swiper-button-prev {
          color: #111827;
          width: 34px;
          height: 34px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.9);
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        }
        .hero-swiper .swiper-button-next::after,
        .hero-swiper .swiper-button-prev::after {
          font-size: 14px;
          font-weight: 700;
        }
      `}</style>
    </section>
    </Container>
  );
};

export default WinterHeroSwiper;
