import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

import Banner1 from "@/assets/banners/17an_Banner_WEB_DESKTOP.webp";
import Banner2 from "@/assets/banners/Launching_Mousemat_Marvel_WEBSITE_DESK.webp";
import Banner3 from "@/assets/banners/WEBSITE_BANNER__Shop_Today_Invest_For_Your_Future_Desktop.webp";
import Banner4 from "@/assets/banners/Website_Mousemat_Marvel_Updated_Desktop.webp";

export const HeroSection = () => {
  const [api, setApi] = useState<CarouselApi | null>(null);

  // simple autoplay
  useEffect(() => {
    if (!api) return;
    const id = setInterval(() => {
      api.scrollNext();
    }, 4000);
    return () => clearInterval(id);
  }, [api]);

  const banners = [
    { src: Banner1, alt: "Independence Day promo banner" },
    { src: Banner2, alt: "Launching Mousemat Marvel banner" },
    { src: Banner3, alt: "Shop Today Invest for Your Future banner" },
    { src: Banner4, alt: "Mousemat Marvel updated banner" },
  ];

  return (
    <section className="px-6 pt-6">
      <div className="mb-4">
        <Carousel
          opts={{ loop: true }}
          setApi={setApi}
          className="w-full"
          aria-label="Promotional banners"
        >
          <CarouselContent>
            {banners.map((b, i) => (
              <CarouselItem key={i}>
                <div className="relative overflow-hidden rounded-xl">
                  {/* image */}
                  <img
                    src={b.src}
                    alt={b.alt}
                    className="block w-full h-40 sm:h-56 md:h-64 object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* arrows inside edges on mobile */}
          <CarouselPrevious className="left-2 -translate-y-1/2" />
          <CarouselNext className="right-2 -translate-y-1/2" />
        </Carousel>
      </div>

    </section>
  );
};