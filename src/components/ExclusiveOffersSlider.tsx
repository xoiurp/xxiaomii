"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  title: string;
  handle: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
    };
  };
  images: {
    edges: {
      node: {
        originalSrc?: string; // Tornar opcional
        transformedSrc: string; // Adicionar
        altText: string | null; // Adicionar
      };
    }[];
  };
}

interface Props {
  products: Product[];
}

const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(timeLeft / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center space-x-2">
      <span className="bg-white text-black font-bold text-xl px-4 py-2 rounded">{hours}</span>
      <span className="text-white text-xl font-bold">:</span>
      <span className="bg-white text-black font-bold text-xl px-4 py-2 rounded">{minutes}</span>
      <span className="text-white text-xl font-bold">:</span>
      <span className="bg-white text-black font-bold text-xl px-4 py-2 rounded">{seconds}</span>
    </div>
  );
};

const ExclusiveOffersSlider = ({ products }: Props) => {
  return (
    <div className="exclusive-offers-slider">
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-black text-white rounded-lg px-6 py-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 sm:mb-0">Ofertas Exclusivas</h2>
          <Countdown />
        </div>
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          slidesPerView={1}
          spaceBetween={30}
          navigation
          loop
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 20,
            },
          }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          className="w-full"
        >
          {products.slice(0, 8).map((product) => (
            <SwiperSlide key={product.id}>
              <div className="flex flex-col p-4 hover:shadow-sm transition-shadow">
                <div className="relative w-full h-48 mb-4 overflow-hidden">
                  {product.images.edges[0]?.node.transformedSrc ? (
                    <Image
                      src={product.images.edges[0].node.transformedSrc} // Alterado
                      alt={product.images.edges[0].node.altText || product.title} // Alterado
                      fill={true}
                      className="object-contain hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-left w-full">
                  <h3 className="font-semibold mb-2 line-clamp-2 h-10 text-sm md:text-base">{product.title}</h3>
                  <p className="text-[#FF6700] font-bold text-lg mb-4">
                    R$ {parseFloat(product.priceRange.minVariantPrice.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <Link
                    href={`/product/${product.handle}`}
                    className="bg-[#FF6700] text-white w-full py-2 rounded-full hover:bg-[#E05A00] transition-all duration-300 font-medium text-center block"
                  >
                    Comprar
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
    </div>
  );
};

export default ExclusiveOffersSlider;
