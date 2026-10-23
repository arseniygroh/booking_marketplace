import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { PropertyImage } from '@/types';
import Image from 'next/image';

export default function ImageSlider({images}: {images: PropertyImage[]}) {
    return (
        <div>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={"auto"}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
          >
            {images.map((image: PropertyImage) => (
              <SwiperSlide key={image.id}>
                <Image src={image.previewUrl} fill objectFit='cover' alt='Property image'/>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
    );
}