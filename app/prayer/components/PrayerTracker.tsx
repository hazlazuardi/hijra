import { useEffect, useRef, useState, useMemo } from "react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Virtual, EffectCoverflow } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import { PrayerStatus } from "@/lib/sync-service";
import { Skeleton } from "@/components/ui/skeleton";

// Status icons component
const StatusIcon = ({ status }: { status: PrayerStatus }) => {
  switch (status) {
    case 'on_time':
      return (
        <svg className="text-green-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      );
    case 'late':
      return (
        <svg className="text-yellow-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      );
    case 'missed':
      return (
        <svg className="text-red-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      );
    default:
      return null;
  }
};

// Prayer card component
const PrayerCard = ({ 
  name, 
  status, 
  time, 
  onClick 
}: { 
  name: string;
  status: PrayerStatus;
  time?: string;
  onClick: () => void;
}) => {
  const statusText = {
    'on_time': 'Prayed on time',
    'late': 'Prayed late',
    'missed': 'Missed prayer',
    'no_entry': 'No entry'
  };

  // Format time display with awareness of timezone
  const formattedTime = time ? new Date(time).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  }) : undefined;

  return (
    <div className={`prayer-card ${status}`} onClick={onClick}>
      <div className="flex justify-between items-center">
        <span className="font-medium">{name}</span>
        <StatusIcon status={status} />
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        <span>{statusText[status]}</span>
        {formattedTime && <span> • {formattedTime}</span>}
      </div>
    </div>
  );
};

// Day view component for a single day
const DayView = ({ 
  date, 
  prayers, 
  onPrayerUpdate,
  isActive
}: { 
  date: Date;
  prayers: Array<{ name: string; status: PrayerStatus; time?: string }>;
  onPrayerUpdate: (date: Date, index: number) => void;
  isActive: boolean;
}) => {
  // No longer need to check for empty arrays - we always have default values now
  return (
    <div className="space-y-3 px-4">
      {prayers.map((prayer, index) => (
        <PrayerCard
          key={prayer.name}
          name={prayer.name}
          status={prayer.status}
          time={prayer.time}
          onClick={() => onPrayerUpdate(date, index)}
        />
      ))}
    </div>
  );
};

type PrayerTrackerProps = {
  currentDate: Date;
  slides: Array<{ date: Date; key: string }>;
  activeIndex: number;
  prayerCache: Record<string, Array<{ name: string; status: PrayerStatus; time?: string }>>;
  onSlideChange: (swiper: SwiperType) => void;
  onPrayerUpdate: (date: Date, index: number) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  onSwiperInit: (swiper: SwiperType) => void;
  formatDateStr: (date: Date) => string;
  parseDateStr: (dateStr: string) => Date;
};

export default function PrayerTracker({
  currentDate,
  slides,
  activeIndex,
  prayerCache,
  onSlideChange,
  onPrayerUpdate,
  goToPreviousDay,
  goToNextDay,
  goToToday,
  onSwiperInit,
  formatDateStr,
  parseDateStr
}: PrayerTrackerProps) {
  const formattedDate = format(currentDate, 'EEEE, MMMM d, yyyy');
  const isToday = isSameDay(currentDate, new Date());
  const swiperInstanceRef = useRef<SwiperType | null>(null);
  
  // Track mounted state to avoid swiper initialization issues
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    
    return () => {
      setIsMounted(false);
    };
  }, []);
  
  // Handle initial swiper setup and ensure it's properly initialized after navigation
  const handleSwiperInit = (swiper: SwiperType) => {
    swiperInstanceRef.current = swiper;
    onSwiperInit(swiper);
  };
  
  // Memoize prayers for efficient rendering and to avoid unnecessary re-renders
  const memoizedPrayers = useMemo(() => {
    return slides.map(slide => {
      const slideKey = formatDateStr(slide.date);
      const prayers = prayerCache[slideKey] || [];
      return {
        key: slideKey,
        prayers
      };
    });
  }, [slides, prayerCache, formatDateStr]);
  
  if (!isMounted || slides.length === 0) {
    return (
      <>
        {/* Date Navigation Skeleton */}
        <div className="date-nav px-4">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex flex-col items-center">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        
        {/* Prayer Cards Skeleton */}
        <div className="mt-4 px-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-md mb-3" />
          ))}
        </div>
      </>
    );
  }
  
  return (
    <>
      {/* Date Navigation */}
      <div className="date-nav px-4">
        <button onClick={goToPreviousDay} className="date-nav-btn" aria-label="Previous day">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        
        <div className="date-display">
          <div className="font-medium">{formattedDate}</div>
          {!isToday && (
            <button 
              onClick={goToToday}
              className="text-xs text-primary mt-1 hover:underline"
            >
              Go to Today
            </button>
          )}
        </div>
        
        <button onClick={goToNextDay} className="date-nav-btn" aria-label="Next day">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>
      
      {/* Prayer Swiper */}
      <div className="mt-4">
        <Swiper
          modules={[Virtual, EffectCoverflow]}
          effect="coverflow"
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 1.5,
            slideShadows: false
          }}
          slidesPerView={1}
          centeredSlides={true}
          initialSlide={activeIndex}
          virtual={{
            enabled: true,
            addSlidesAfter: 1,
            addSlidesBefore: 1
          }}
          onSwiper={handleSwiperInit}
          onSlideChange={onSlideChange}
          className="prayer-swiper"
        >
          {slides.map((slide, index) => {
            const slideKey = formatDateStr(slide.date);
            const prayerData = memoizedPrayers.find(p => p.key === slideKey);
            const prayers = prayerData ? prayerData.prayers : [];
            
            return (
              <SwiperSlide key={slideKey} virtualIndex={index}>
                {({ isActive }) => (
                  <div className="swiper-slide-content">
                    <DayView 
                      date={slide.date}
                      prayers={prayers}
                      onPrayerUpdate={onPrayerUpdate}
                      isActive={isActive}
                    />
                  </div>
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </>
  );
} 