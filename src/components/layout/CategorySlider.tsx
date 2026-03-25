"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Link from "next/link";
import Image from "next/image";

interface Category {
  id: string;
  title: string;
  handle: string;
  image?: {
    transformedSrc: string;
    altText: string | null;
  };
}

interface Props {
  categories: Category[];
}

const CategorySlider = ({ categories }: Props) => {
  return (
    <section className="category-slider py-6 sm:py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Título responsivo */}
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 md:mb-8 text-center">
          Revolucione sua vida com tecnologia Xiaomi
        </h2>
        
        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            slidesPerView={1.2}
            centeredSlides={false}
            spaceBetween={12}
            navigation={{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }}
            loop={categories.length > 3}
            breakpoints={{
              375: {
                slidesPerView: 1.3,
                spaceBetween: 12,
              },
              480: {
                slidesPerView: 1.5,
                spaceBetween: 16,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              768: {
                slidesPerView: 2.5,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1280: {
                slidesPerView: 3.5,
                spaceBetween: 24,
              },
            }}
            className="w-full !pb-2"
          >
            {categories.map((category) => (
              <SwiperSlide key={category.id} className="!h-auto">
                <Link 
                  href={`/shop/${category.handle}`} 
                  className="block group"
                >
                  {/* Container responsivo com aspect-ratio */}
                  <div className="relative w-full">
                    <div className="rounded-lg overflow-hidden relative aspect-[3/4] sm:aspect-[3/4]">
                      {category.image && category.image.transformedSrc ? (
                        <Image
                          src={category.image.transformedSrc}
                          alt={category.image.altText || category.title}
                          fill
                          sizes="(max-width: 480px) 80vw, (max-width: 640px) 50vw, (max-width: 768px) 40vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400"
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
                      
                      {/* Overlay gradient para melhor legibilidade */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    
                    {/* Botão de categoria - Touch target adequado */}
                    <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[280px]">
                      <div className="min-h-[44px] flex items-center justify-center border border-white hover:border-transparent bg-black/30 backdrop-blur-sm px-3 sm:px-4 py-2.5 sm:py-3 rounded-full text-center transition-all duration-300 hover:bg-[#FF6700] group-hover:bg-[#FF6700]">
                        <h3 className="text-white text-sm sm:text-base md:text-lg font-bold uppercase truncate">
                          {category.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Botões de navegação - Touch targets 44px */}
          <button 
            className="swiper-button-prev-custom absolute left-0 sm:left-2 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-full bg-[#FF6700] text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#e55a00] transition-colors active:scale-95"
            aria-label="Anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button 
            className="swiper-button-next-custom absolute right-0 sm:right-2 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-full bg-[#FF6700] text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#e55a00] transition-colors active:scale-95"
            aria-label="Próximo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategorySlider;
