"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const desktopImages = [
  "/assets/images/banner1-mibando10.webp",
  "/assets/images/banner2-watch5.webp",
  "/assets/images/banner3-buds8lite.webp",
  "/assets/images/banner4-consumidor.webp",
];

const mobileImages = [
  "/assets/images/buds-lite-vertical.webp",
  "/assets/images/buds-lite-vertical-1.webp",
  "/assets/images/buds-lite-vertical-2.webp",
  "/assets/images/Group 178.webp",
];

const BannerSlider = () => {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block w-full aspect-[2.2] relative mb-12 group">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          navigation
          pagination={{ clickable: true }}
          loop
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          className="w-full h-full"
        >
          {desktopImages.map((src, index) => (
            <SwiperSlide key={index}>
              <div className="w-full h-full relative">
                <Image
                  src={src}
                  alt={`Banner ${index + 1}`}
                  fill={true}
                  className="object-cover"
                  priority={index === 0}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Mobile */}
      <div className="block md:hidden w-full aspect-[3/4] relative mb-6 group">
        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{ clickable: true }}
          loop
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          className="w-full h-full"
        >
          {mobileImages.map((src, index) => (
            <SwiperSlide key={index}>
              <div className="w-full h-full relative">
                <Image
                  src={src}
                  alt={`Banner ${index + 1}`}
                  fill={true}
                  className="object-cover"
                  priority={index === 0}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style jsx global>{`
        .swiper-button-next,
        .swiper-button-prev {
          @apply opacity-0 transition-opacity duration-300;
        }
        .group:hover .swiper-button-next,
        .group:hover .swiper-button-prev {
          @apply opacity-100;
        }
        .swiper-button-next,
        .swiper-button-prev {
          @apply w-12 h-12 rounded-full bg-white text-black flex items-center justify-center border border-gray-300;
        }
        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          @apply bg-[#FF6700] text-white border-[#FF6700];
        }
        .swiper-button-next::after,
        .swiper-button-prev::after {
          font-size: 1.2rem;
        }
      `}</style>
    </>
  );
};

export default BannerSlider;
