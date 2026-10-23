import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { PropertyImage } from '@/types';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useState } from 'react';

export default function ImageSlider({images}: {images: PropertyImage[]}) {
    const [index, setIndex] = useState<number>(-1);
    const lightboxSlides = images.map(img => ({src: img.previewUrl, alt: 'Property image'}));

    return (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 group">
            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={0}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true, dynamicBullets: true }}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                className="h-[300px] sm:h-[400px] md:h-[500px] w-full"
            >
                {images.map((image: PropertyImage, i: number) => (
                    <SwiperSlide key={image.id}>
                        <button 
                            onClick={() => setIndex(i)} 
                            className="relative w-full h-full block overflow-hidden focus:outline-none"
                        >
                            <Image 
                                src={image.previewUrl} 
                                fill 
                                className="object-cover transition-transform duration-700 hover:scale-105" 
                                alt='Property view'
                                unoptimized 
                            />
                        </button>
                    </SwiperSlide>
                ))}
            </Swiper>
            
            <Lightbox
                index={index}
                slides={lightboxSlides}
                open={index >= 0}
                close={() => setIndex(-1)}
            />
        </div>
    );
}