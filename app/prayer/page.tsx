"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { useAuthStore } from "@/lib/store/authStore";
import { useNavStore } from "@/lib/store/navStore";
import { fetchPrayers, savePrayerOffline, getNextPrayerStatus, PrayerStatus, getRecentPrayers } from "@/lib/sync-service";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Virtual, EffectCoverflow } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

// Status styles for different prayer states
const statusStyles = {
  'on_time': { container: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900', icon: 'bg-green-500' },
  'late': { container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-900', icon: 'bg-yellow-500' },
  'missed': { container: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900', icon: 'bg-red-500' },
  'no_entry': { container: 'bg-card border-border', icon: 'bg-gray-300 dark:bg-gray-700' }
};

// Status descriptions
const statusDescriptions = {
  'on_time': 'Prayed on time',
  'late': 'Prayed late',
  'missed': 'Missed prayer',
  'no_entry': 'No entry'
};

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

  return (
    <div className={`prayer-card ${status}`} onClick={onClick}>
      <div className="flex justify-between items-center">
        <span className="font-medium">{name}</span>
        <StatusIcon status={status} />
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        <span>{statusText[status]}</span>
        {time && <span> • {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
      </div>
    </div>
  );
};

// Day view component for a single day
const DayView = ({ 
  date, 
  prayers, 
  onPrayerUpdate 
}: { 
  date: Date;
  prayers: Array<{ name: string; status: PrayerStatus; time?: string }>;
  onPrayerUpdate: (date: Date, index: number) => void;
}) => {
  return (
    <div className="space-y-3 px-4">
      {prayers.length === 0 ? (
        <div className="min-h-[60px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        prayers.map((prayer, index) => (
          <PrayerCard
            key={prayer.name}
            name={prayer.name}
            status={prayer.status}
            time={prayer.time}
            onClick={() => onPrayerUpdate(date, index)}
          />
        ))
      )}
    </div>
  );
};

// Prayer names in order
const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

// Format date to YYYY-MM-DD
const formatDateStr = (date: Date) => date.toISOString().split('T')[0];

// Prayer Trends HeatMap component (GitHub-style contribution chart)
const PrayerTrendsChart = ({ userId, prayerCache }: { 
  userId: string,
  prayerCache: Record<string, Array<{ name: string; status: PrayerStatus; time?: string }>>
}) => {
  const [contributionData, setContributionData] = useState<Array<{
    date: string;
    prayers: Array<{ name: string; status: PrayerStatus; time?: string }>;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Days to display in the chart (last 14 days including today)
  const daysToShow = 14;
  
  // Create skeleton data for smooth loading
  const skeletonData = useMemo(() => {
    const today = new Date();
    const result = [];
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = subDays(today, i);
      result.push({
        date: formatDateStr(date),
        prayers: prayerNames.map(name => ({ name, status: 'no_entry' as PrayerStatus }))
      });
    }
    return result;
  }, []);
  
  // Load prayer data for the chart
  useEffect(() => {
    const loadPrayerTrendsData = async () => {
      try {
        // Get prayer data from cache and server
        const recentPrayers = await getRecentPrayers(userId, daysToShow);
        
        // Merge with cache data to ensure up-to-date representation
        const mergedData = [...recentPrayers];
        
        // Update with the latest data from cache
        Object.entries(prayerCache).forEach(([date, prayers]) => {
          const existingIndex = mergedData.findIndex(d => d.date === date);
          if (existingIndex >= 0) {
            // Update existing entry
            mergedData[existingIndex] = { date, prayers };
          } else {
            // Add new entry if within our date range
            const entryDate = new Date(date);
            const today = new Date();
            const oldestDate = subDays(today, daysToShow - 1);
            
            if (entryDate >= oldestDate && entryDate <= today) {
              mergedData.push({ date, prayers });
            }
          }
        });
        
        setContributionData(mergedData);
      } catch (error) {
        console.error("Error loading prayer trends data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPrayerTrendsData();
  }, [userId, prayerCache, daysToShow]);
  
  // Get color based on prayer status
  const getStatusColor = useCallback((status: PrayerStatus) => {
    switch (status) {
      case 'on_time': return 'bg-green-500';
      case 'late': return 'bg-yellow-500';
      case 'missed': return 'bg-red-500';
      case 'no_entry': return 'bg-gray-200 dark:bg-gray-700';
      default: return 'bg-gray-200 dark:bg-gray-700';
    }
  }, []);
  
  // Get status text
  const getStatusText = useCallback((status: PrayerStatus) => {
    switch (status) {
      case 'on_time': return 'On Time';
      case 'late': return 'Late';
      case 'missed': return 'Missed';
      case 'no_entry': return 'No Entry';
      default: return 'No Entry';
    }
  }, []);
  
  // Sort and prepare data for the chart
  const sortedData = useMemo(() => {
    const data = isLoading ? skeletonData : [...contributionData];
    return data
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-daysToShow); // Ensure we only show the latest days
  }, [isLoading, contributionData, skeletonData, daysToShow]);
  
  // Scroll to the current day (rightmost) when data loads
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.scrollLeft = chartRef.current.scrollWidth;
    }
  }, [sortedData]);
  
  // Render the GitHub-style heat map
  return (
    <div className="w-full px-4">
      {/* Legend */}
      <div className="mb-2 flex flex-wrap items-center justify-end gap-2 text-xs">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded bg-green-500 mr-1"></div>
          <span>On Time</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded bg-yellow-500 mr-1"></div>
          <span>Late</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded bg-red-500 mr-1"></div>
          <span>Missed</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded bg-gray-200 dark:bg-gray-700 mr-1"></div>
          <span>No Entry</span>
        </div>
      </div>
      
      <div 
        ref={chartRef}
        className="w-full overflow-x-auto hide-scrollbar border rounded-lg bg-card"
      >
        <div className="min-w-full flex">
          {/* Y-axis labels (Prayer names) */}
          <div className="sticky left-0 z-20 bg-card pr-2 border-r">
            {/* Header for month labels */}
            <div className="h-8 flex items-end pb-1">
              <span className="text-xs font-medium px-2 text-muted-foreground">Prayer</span>
            </div>
            {/* Prayer names */}
            {prayerNames.map(prayer => (
              <div key={prayer} className="h-8 flex items-center">
                <span className="text-xs font-medium px-2">{prayer}</span>
              </div>
            ))}
          </div>
          
          {/* Heat map grid */}
          <div className="flex-1 z-10">
            {/* Month labels and dates */}
            <div className="flex">
              {sortedData.map((day, index) => {
                const date = new Date(day.date);
                const isToday = isSameDay(date, new Date());
                const isFirstOfMonth = date.getDate() === 1;
                const isPreviousDifferentMonth = index > 0 && 
                  date.getMonth() !== new Date(sortedData[index-1].date).getMonth();
                const showMonth = isFirstOfMonth || isPreviousDifferentMonth || index === 0;
                
                return (
                  <div 
                    key={day.date} 
                    className={`w-8 flex-shrink-0 text-center ${
                      isToday ? 'bg-primary/5' : ''
                    }`}
                  >
                    {/* Month - only shown for first day of month or first date in dataset */}
                    <div className="h-4 flex items-center justify-center">
                      {showMonth && (
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {format(date, 'MMM')}
                        </span>
                      )}
                    </div>
                    {/* Date */}
                    <div className={`text-[10px] ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                      {format(date, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Prayer status cells (heat map) */}
            {prayerNames.map(prayer => (
              <div key={prayer} className="flex">
                {sortedData.map(day => {
                  const entry = day.prayers.find(p => p.name === prayer);
                  const status = entry?.status || 'no_entry';
                  const isToday = isSameDay(new Date(day.date), new Date());
                  
                  return (
                    <div 
                      key={`${day.date}-${prayer}`} 
                      className={`w-8 h-8 flex-shrink-0 flex items-center justify-center ${
                        isToday ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div 
                        className={`w-6 h-6 rounded transition-colors ${getStatusColor(status)} ${
                          isLoading ? 'opacity-40 animate-pulse' : 'hover:scale-110 hover:z-10'
                        }`}
                        title={`${prayer} on ${format(new Date(day.date), 'MMM d, yyyy')}: ${getStatusText(status)}`}
                      ></div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PrayerPage() {
  const { user, checkUser } = useAuthStore();
  const { setActiveSection } = useNavStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [prayerCache, setPrayerCache] = useState<Record<string, Array<{ name: string; status: PrayerStatus; time?: string }>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [slides, setSlides] = useState<Array<{ date: Date; key: string }>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);
  
  // Check user authentication and set active section
  useEffect(() => {
    checkUser();
    setActiveSection('prayer');
    
    // Initialize slides
    initializeSlides();
    
    // Check online status
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [checkUser, setActiveSection]);
  
  // Initialize slides with today and some days before/after
  const initializeSlides = () => {
    const today = new Date();
    const initialSlides: Array<{ date: Date; key: string }> = [];
    
    // Add 10 days before today
    for (let i = 10; i > 0; i--) {
      const date = subDays(today, i);
      initialSlides.push({
        date,
        key: formatDateStr(date)
      });
    }
    
    // Add today
    initialSlides.push({
      date: today,
      key: formatDateStr(today)
    });
    
    // Add 10 days after today
    for (let i = 1; i <= 10; i++) {
      const date = addDays(today, i);
      initialSlides.push({
        date,
        key: formatDateStr(date)
      });
    }
    
    setSlides(initialSlides);
    setActiveIndex(10); // Today's index
    
    // Load prayers for today
    loadPrayers(today);
  };
  
  // Load prayers for a specific date
  const loadPrayers = async (date: Date) => {
    if (!user) return;
    
    const dateStr = formatDateStr(date);
    
    // Check if we already have this date in cache
    if (prayerCache[dateStr]) {
      return;
    }
    
    setIsLoading(true);
    try {
      const prayers = await fetchPrayers(user.id, dateStr);
      setPrayerCache(prev => ({
        ...prev,
        [dateStr]: prayers
      }));
    } catch (error) {
      console.error("Error loading prayers:", error);
    } finally {
      setIsLoading(false);
    }
    
    // Preload adjacent days
    preloadAdjacentDays(date);
  };
  
  // Preload prayers for days before and after the current date
  const preloadAdjacentDays = async (date: Date) => {
    if (!user) return;
    
    // Preload previous day
    const prevDay = subDays(date, 1);
    const prevDayStr = formatDateStr(prevDay);
    if (!prayerCache[prevDayStr]) {
      const prevPrayers = await fetchPrayers(user.id, prevDayStr);
      setPrayerCache(prev => ({
        ...prev,
        [prevDayStr]: prevPrayers
      }));
    }
    
    // Preload next day
    const nextDay = addDays(date, 1);
    const nextDayStr = formatDateStr(nextDay);
    if (!prayerCache[nextDayStr]) {
      const nextPrayers = await fetchPrayers(user.id, nextDayStr);
      setPrayerCache(prev => ({
        ...prev,
        [nextDayStr]: nextPrayers
      }));
    }
  };
  
  // Update prayer status
  const updatePrayerStatus = async (date: Date, index: number) => {
    if (!user) return;
    
    const dateStr = formatDateStr(date);
    if (!prayerCache[dateStr]) return;
    
    const prayers = [...prayerCache[dateStr]];
    const prayer = prayers[index];
    
    const nextStatus = getNextPrayerStatus(prayer.status);
    prayers[index] = {
      ...prayer,
      status: nextStatus,
      time: nextStatus !== 'no_entry' ? new Date().toISOString() : undefined
    };
    
    setPrayerCache(prev => ({ ...prev, [dateStr]: prayers }));
    await savePrayerOffline(user.id, dateStr, prayers);
  };
  
  // Handle slide change
  const handleSlideChange = (swiper: SwiperType) => {
    const newIndex = swiper.activeIndex;
    setActiveIndex(newIndex);
    
    // Load prayers for the current slide if needed
    if (slides[newIndex]) {
      const currentSlideDate = slides[newIndex].date;
      setCurrentDate(currentSlideDate);
      loadPrayers(currentSlideDate);
    }
    
    // Add more slides if we're getting close to the end
    if (newIndex >= slides.length - 5) {
      appendSlides();
    }
    
    // Add more slides if we're getting close to the beginning
    if (newIndex <= 5) {
      prependSlides();
    }
  };
  
  // Append slides to the end
  const appendSlides = () => {
    if (slides.length === 0) return;
    
    const lastDate = slides[slides.length - 1].date;
    const newSlides: Array<{ date: Date; key: string }> = [];
    
    for (let i = 1; i <= 10; i++) {
      const date = addDays(lastDate, i);
      newSlides.push({
        date,
        key: formatDateStr(date)
      });
    }
    
    setSlides(prev => [...prev, ...newSlides]);
  };
  
  // Prepend slides to the beginning
  const prependSlides = () => {
    if (slides.length === 0) return;
    
    const firstDate = slides[0].date;
    const newSlides: Array<{ date: Date; key: string }> = [];
    
    for (let i = 10; i >= 1; i--) {
      const date = subDays(firstDate, i);
      newSlides.push({
        date,
        key: formatDateStr(date)
      });
    }
    
    setSlides(prev => [...newSlides, ...prev]);
    
    // Adjust active index to account for the new slides
    setActiveIndex(prev => prev + newSlides.length);
    
    // Update the swiper's active index
    if (swiperRef.current) {
      swiperRef.current.activeIndex = activeIndex + newSlides.length;
      swiperRef.current.update();
    }
  };
  
  // Go to today
  const goToToday = () => {
    const todayIndex = slides.findIndex(slide => 
      isSameDay(slide.date, new Date())
    );
    
    if (todayIndex >= 0 && swiperRef.current) {
      swiperRef.current.slideTo(todayIndex);
    }
  };
  
  // Go to previous day
  const goToPreviousDay = () => {
    if (swiperRef.current && activeIndex > 0) {
      swiperRef.current.slideTo(activeIndex - 1);
    }
  };
  
  // Go to next day
  const goToNextDay = () => {
    if (swiperRef.current && activeIndex < slides.length - 1) {
      swiperRef.current.slideTo(activeIndex + 1);
    }
  };
  
  const formattedDate = format(currentDate, 'EEEE, MMMM d, yyyy');
  const isToday = isSameDay(currentDate, new Date());
  
  return (
    <div className="flex flex-col pb-20 max-w-md mx-auto w-full">
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold mb-2">Prayer Tracking</h1>
        <div className="text-xs text-muted-foreground mb-4">
          {isOnline ? (
            <span className="text-green-500">Online - Changes will sync automatically</span>
          ) : (
            <span className="text-amber-500">Offline - Changes will sync when online</span>
          )}
        </div>

        {/* Prayer Trends */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Prayer Trends</h2>
          </div>
        </div>
      </div>

      {/* Prayer Trends Chart */}
      <div className="mb-6 -mt-2">
        {user && <PrayerTrendsChart userId={user.id} prayerCache={prayerCache} />}
      </div>

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
      {user && (
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
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={handleSlideChange}
            className="prayer-swiper"
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={slide.key} virtualIndex={index}>
                {({ isActive }) => (
                  <div className="swiper-slide-content">
                    <DayView 
                      date={slide.date}
                      prayers={prayerCache[slide.key] || []}
                      onPrayerUpdate={updatePrayerStatus}
                    />
                    {isActive && !prayerCache[slide.key] && (
                      <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}
