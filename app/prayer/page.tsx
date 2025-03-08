"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format, addDays, subDays, isSameDay, parseISO } from "date-fns";
import { useAuthStore } from "@/lib/store/authStore";
import { useNavStore } from "@/lib/store/navStore";
import { fetchPrayers, savePrayerOffline, getNextPrayerStatus, PrayerStatus } from "@/lib/sync-service";
import type { Swiper as SwiperType } from 'swiper';
import PrayerHeatmap from "./components/PrayerHeatmap";
import PrayerTracker from "./components/PrayerTracker";

// Format date to YYYY-MM-DD using local timezone to avoid timezone issues
const formatDateStr = (date: Date) => {
  // Get year, month, and day in local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based in JS
  const day = String(date.getDate()).padStart(2, '0');
  
  // Return in YYYY-MM-DD format
  return `${year}-${month}-${day}`;
};

// Parse a YYYY-MM-DD string to a Date in local timezone
const parseDateStr = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(part => parseInt(part, 10));
  return new Date(year, month - 1, day); // Months are 0-based in JS
};

// Default prayers array for reuse
const DEFAULT_PRAYERS = [
  { name: "Fajr", status: 'no_entry' as PrayerStatus },
  { name: "Dhuhr", status: 'no_entry' as PrayerStatus },
  { name: "Asr", status: 'no_entry' as PrayerStatus },
  { name: "Maghrib", status: 'no_entry' as PrayerStatus },
  { name: "Isha", status: 'no_entry' as PrayerStatus }
];

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
  const isInitialMount = useRef(true);
  const todayStr = formatDateStr(new Date());
  const dataLoadTriggeredRef = useRef(false);
  const updatePrayerStatusPendingRef = useRef<Record<string, boolean>>({});
  
  // Load prayers for a specific date - defined before use in useEffect
  const loadPrayers = useCallback(async (date: Date) => {
    if (!user) return;
    
    const dateStr = formatDateStr(date);
    
    // Check if we already have this date in cache
    if (prayerCache[dateStr] && prayerCache[dateStr].length > 0) {
      return prayerCache[dateStr];
    }
    
    setIsLoading(true);
    try {
      const prayers = await fetchPrayers(user.id, dateStr);
      
      // Update cache atomically to avoid race conditions
      setPrayerCache(prev => {
        // Check again inside the update function to avoid race conditions
        if (prev[dateStr] && prev[dateStr].length > 0) {
          return prev;
        }
        return {
          ...prev,
          [dateStr]: prayers
        };
      });
      
      // Preload adjacent days without blocking
      setTimeout(() => preloadAdjacentDays(date), 0);
      
      return prayers;
    } catch (error) {
      console.error("Error loading prayers:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, prayerCache]);
  
  // Preload prayers for days before and after the current date
  const preloadAdjacentDays = useCallback(async (date: Date) => {
    if (!user) return;
    
    // Preload previous day
    const prevDay = subDays(date, 1);
    const prevDayStr = formatDateStr(prevDay);
    if (!prayerCache[prevDayStr]) {
      try {
        const prevPrayers = await fetchPrayers(user.id, prevDayStr);
        setPrayerCache(prev => ({
          ...prev,
          [prevDayStr]: prevPrayers
        }));
      } catch (error) {
        console.error("Error preloading previous day:", error);
      }
    }
    
    // Preload next day
    const nextDay = addDays(date, 1);
    const nextDayStr = formatDateStr(nextDay);
    if (!prayerCache[nextDayStr]) {
      try {
        const nextPrayers = await fetchPrayers(user.id, nextDayStr);
        setPrayerCache(prev => ({
          ...prev,
          [nextDayStr]: nextPrayers
        }));
      } catch (error) {
        console.error("Error preloading next day:", error);
      }
    }
  }, [user, prayerCache]);
  
  // Check user authentication and set active section
  useEffect(() => {
    checkUser();
    setActiveSection('prayer');
    
    // Check online status
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      dataLoadTriggeredRef.current = false;
    };
  }, [checkUser, setActiveSection]);
  
  // Initialize slides with today and some days before/after
  const initializeSlides = useCallback(() => {
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
    setActiveIndex(10); // Today's index (10th item, after 10 days before)
    
    return initialSlides;
  }, []);
  
  // On component mount, initialize slides and load data
  useEffect(() => {
    if (isInitialMount.current) {
      const initialSlides = initializeSlides();
      isInitialMount.current = false;
      
      // Immediately load today's prayers if the user is already authenticated
      if (user) {
        const today = new Date();
        loadPrayers(today);
        dataLoadTriggeredRef.current = true;
      }
    }
  }, [initializeSlides, user, loadPrayers]);
  
  // Ensure today's data is loaded, but only once to avoid loops
  useEffect(() => {
    if (user && !dataLoadTriggeredRef.current) {
      if (!prayerCache[todayStr] || prayerCache[todayStr].length === 0) {
        loadPrayers(new Date());
        dataLoadTriggeredRef.current = true;
      }
    }
  }, [user, loadPrayers, prayerCache, todayStr]);
  
  // Update prayer status with optimistic UI pattern
  const updatePrayerStatus = useCallback(async (date: Date, index: number) => {
    if (!user) return;
    
    const dateStr = formatDateStr(date);
    if (!prayerCache[dateStr]) return;
    
    const prayers = [...prayerCache[dateStr]];
    const prayer = prayers[index];
    
    const nextStatus = getNextPrayerStatus(prayer.status);
    
    // Construct the timestamp in a timezone-aware way
    const now = new Date();
    const timestamp = now.toISOString();
    
    // Create updated prayer data
    const updatedPrayer = {
      ...prayer,
      status: nextStatus,
      time: nextStatus !== 'no_entry' ? timestamp : undefined
    };
    
    // Create updated prayers array
    prayers[index] = updatedPrayer;
    
    // Generate unique key for tracking this update
    const updateKey = `${dateStr}-${index}-${Date.now()}`;
    updatePrayerStatusPendingRef.current[updateKey] = true;
    
    // OPTIMISTIC UPDATE - Update UI immediately
    setPrayerCache(prev => ({ 
      ...prev, 
      [dateStr]: prayers 
    }));
    
    try {
      // Perform actual save operation in background
      await savePrayerOffline(user.id, dateStr, prayers);
    } catch (error) {
      console.error("Error saving prayer status:", error);
      
      // If save fails, revert to previous state
      if (updatePrayerStatusPendingRef.current[updateKey]) {
        const originalPrayers = [...prayerCache[dateStr]];
        originalPrayers[index] = prayer; // Revert to original prayer
        
        setPrayerCache(prev => ({
          ...prev, 
          [dateStr]: originalPrayers
        }));
      }
    } finally {
      // Clean up tracking
      if (updatePrayerStatusPendingRef.current[updateKey]) {
        delete updatePrayerStatusPendingRef.current[updateKey];
      }
    }
  }, [user, prayerCache]);
  
  // Handle slide change
  const handleSlideChange = useCallback((swiper: SwiperType) => {
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
  }, [slides, loadPrayers]);
  
  // Append slides to the end
  const appendSlides = useCallback(() => {
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
  }, [slides]);
  
  // Prepend slides to the beginning
  const prependSlides = useCallback(() => {
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
  }, [slides, activeIndex]);
  
  // Go to today
  const goToToday = useCallback(() => {
    const todayIndex = slides.findIndex(slide => 
      isSameDay(slide.date, new Date())
    );
    
    if (todayIndex >= 0 && swiperRef.current) {
      swiperRef.current.slideTo(todayIndex);
    }
  }, [slides]);
  
  // Go to previous day
  const goToPreviousDay = useCallback(() => {
    if (swiperRef.current && activeIndex > 0) {
      swiperRef.current.slideTo(activeIndex - 1);
    }
  }, [activeIndex]);
  
  // Go to next day
  const goToNextDay = useCallback(() => {
    if (swiperRef.current && activeIndex < slides.length - 1) {
      swiperRef.current.slideTo(activeIndex + 1);
    }
  }, [activeIndex, slides.length]);
  
  // Handle swiper initialization
  const handleSwiperInit = useCallback((swiper: SwiperType) => {
    // Store swiper instance
    swiperRef.current = swiper;
    
    // Load today's prayers immediately if possible
    if (slides[activeIndex]) {
      const currentSlideDate = slides[activeIndex].date;
      
      // If this is the today slide and we already have the data, no need to reload
      const currentDateStr = formatDateStr(currentSlideDate);
      if (prayerCache[currentDateStr] && prayerCache[currentDateStr].length > 0) {
        return;
      }
      
      // Otherwise load the data for the current date
      loadPrayers(currentSlideDate);
    }
  }, [activeIndex, slides, loadPrayers, prayerCache]);
  
  // Create a properly typed version of the enhanced cache
  const enhancedCache: Record<string, Array<{ name: string; status: PrayerStatus; time?: string }>> = {...prayerCache};
  
  // Ensure today has a value
  if (!enhancedCache[todayStr] || enhancedCache[todayStr].length === 0) {
    enhancedCache[todayStr] = [...DEFAULT_PRAYERS];
  }
  
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
        {user && (
          <PrayerHeatmap 
            userId={user.id} 
            prayerCache={prayerCache} 
            formatDateStr={formatDateStr}
            parseDateStr={parseDateStr}
          />
        )}
      </div>

      {/* Prayer Tracker */}
      {user && (
        <PrayerTracker
          currentDate={currentDate}
          slides={slides}
          activeIndex={activeIndex}
          prayerCache={enhancedCache}
          onSlideChange={handleSlideChange}
          onPrayerUpdate={updatePrayerStatus}
          goToPreviousDay={goToPreviousDay}
          goToNextDay={goToNextDay}
          goToToday={goToToday}
          onSwiperInit={handleSwiperInit}
          formatDateStr={formatDateStr}
          parseDateStr={parseDateStr}
        />
      )}
    </div>
  );
}
