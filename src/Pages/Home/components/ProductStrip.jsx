import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FiHeart } from "react-icons/fi";
import "swiper/css";
import "swiper/css/navigation";

function Price({ price, salePrice, unit }) {
  if (typeof salePrice === "number") {
    return (
      <div className="space-y-1">
        <div className="text-emerald-700 font-extrabold">
          Now ৳{salePrice}
          {unit ? <span className="text-xs font-semibold opacity-70"> /{unit}</span> : null}
        </div>
        <div className="text-xs line-through opacity-60">৳{price}</div>
      </div>
    );
  }
  return (
    <div className="font-extrabold">
      ৳{price}
      {unit ? <span className="text-xs font-semibold opacity-70"> /{unit}</span> : null}
    </div>
  );
}

export default function ProductStrip({ items = [] }) {
  if (!items.length) return null;

  return (
    <Swiper
      modules={[Navigation]}
      navigation
      spaceBetween={12}
      slidesPerView={1.25}
      breakpoints={{
        480: { slidesPerView: 2.2 },
        768: { slidesPerView: 3.2 },
        1024: { slidesPerView: 5.2 },
      }}
    >
      {items.map((p) => (
        <SwiperSlide key={p._id}>
          <div className="rounded-3xl border border-base-200 bg-base-100 overflow-hidden hover:shadow-lg transition">
            <div className="relative h-40 bg-base-200">
              {p.badge ? (
                <span className="absolute left-2 top-2 badge badge-error badge-sm">
                  {p.badge}
                </span>
              ) : null}

              <button
                className="absolute right-2 top-2 btn btn-xs btn-circle bg-base-100/85 border-0 hover:bg-base-100"
                type="button"
                title="Save"
              >
                <FiHeart />
              </button>

              {p.image ? (
                <img
                  src={p.image}
                  alt={p.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>

            <div className="p-3 space-y-2">
              <div className="text-sm font-semibold line-clamp-2 min-h-[40px]">
                {p.title}
              </div>

              <Price price={p.price} salePrice={p.salePrice} unit={p.unit} />

              <div className="flex items-center gap-2">
                <button className="btn btn-sm rounded-full flex-1" type="button">
                  + Add
                </button>
                <button className="btn btn-sm rounded-full btn-outline" type="button">
                  Options
                </button>
              </div>

              <div className="text-[11px] opacity-70 leading-tight">
                {p.deliveryText || "Delivery • Pickup today"}
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
