import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, subDays, isSameDay } from "date-fns";
import { getRecentPrayers, PrayerStatus } from "@/lib/sync-service";
import { Skeleton } from "@/components/ui/skeleton";

// Prayer names in order
const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

type PrayerHeatmapProps = {
  userId: string;
  prayerCache: Record<string, Array<{ name: string; status: PrayerStatus; time?: string }>>;
  formatDateStr: (date: Date) => string;
  parseDateStr: (dateStr: string) => Date;
};

export default function PrayerHeatmap({ 
  userId, 
  prayerCache,
  formatDateStr,
  parseDateStr
}: PrayerHeatmapProps) {
  const [contributionData, setContributionData] = useState<Array<{
    date: string;
    prayers: Array<{ name: string; status: PrayerStatus; time?: string }>;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const initialLoadCompletedRef = useRef(false);
  
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
        prayers: prayerNames.map(name => ({ name, status: 'no_entry' as PrayerStatus, time: undefined }))
      });
    }
    return result;
  }, [formatDateStr]);
  
  // Load prayer data for the chart
  useEffect(() => {
    const loadPrayerTrendsData = async () => {
      try {
        // Get prayer data from cache and server with timezone-aware date handling
        const recentPrayers = await getRecentPrayers(userId, daysToShow, formatDateStr);
        
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
            const entryDate = parseDateStr(date);
            const today = new Date();
            const oldestDate = subDays(today, daysToShow - 1);
            
            if (entryDate >= oldestDate && entryDate <= today) {
              mergedData.push({ date, prayers });
            }
          }
        });
        
        setContributionData(mergedData);
        initialLoadCompletedRef.current = true;
      } catch (error) {
        console.error("Error loading prayer trends data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      loadPrayerTrendsData();
    }
  }, [userId, daysToShow, formatDateStr, parseDateStr]);
  
  // Update the contribution data when prayerCache changes (optimistic updates)
  useEffect(() => {
    if (!initialLoadCompletedRef.current) return; // Skip if initial load hasn't completed
    
    // Update contribution data with the latest cache changes
    setContributionData(prevData => {
      const updatedData = [...prevData];
      
      // Check each entry in prayer cache and update corresponding data
      Object.entries(prayerCache).forEach(([date, prayers]) => {
        const existingIndex = updatedData.findIndex(d => d.date === date);
        
        if (existingIndex >= 0) {
          // Update existing entry
          updatedData[existingIndex] = { date, prayers };
        } else {
          // Add new entry if within our date range
          const entryDate = parseDateStr(date);
          const today = new Date();
          const oldestDate = subDays(today, daysToShow - 1);
          
          if (entryDate >= oldestDate && entryDate <= today) {
            updatedData.push({ date, prayers });
          }
        }
      });
      
      return updatedData;
    });
  }, [prayerCache, parseDateStr, daysToShow]);
  
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
      .sort((a, b) => {
        // Use parseDateStr to convert string dates to Date objects for comparison
        const dateA = parseDateStr(a.date);
        const dateB = parseDateStr(b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-daysToShow); // Ensure we only show the latest days
  }, [isLoading, contributionData, skeletonData, daysToShow, parseDateStr]);
  
  // Scroll to the current day (rightmost) when data loads
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.scrollLeft = chartRef.current.scrollWidth;
    }
  }, [sortedData]);
  
  // GitHub-style Heatmap Skeleton
  if (isLoading) {
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
        
        {/* GitHub-style heatmap skeleton */}
        <div 
          className="w-full overflow-x-auto hide-scrollbar border rounded-lg bg-card"
        >
          <div className="min-w-full flex">
            {/* Y-axis labels (Prayer names) */}
            <div className="sticky left-0 z-20 bg-card pr-2 border-r">
              {/* Header for month labels */}
              <div className="h-8 flex items-end pb-1">
                <Skeleton className="w-16 h-4" />
              </div>
              {/* Prayer names */}
              {prayerNames.map(prayer => (
                <div key={prayer} className="h-8 flex items-center">
                  <Skeleton className="w-16 h-4" />
                </div>
              ))}
            </div>
            
            {/* Heat map grid */}
            <div className="flex-1 z-10">
              {/* Month labels and dates */}
              <div className="flex">
                {Array.from({ length: daysToShow }).map((_, index) => (
                  <div key={index} className="w-8 flex-shrink-0 text-center">
                    <Skeleton className="h-4 w-6 mx-auto" />
                    <Skeleton className="h-4 w-4 mx-auto mt-1" />
                  </div>
                ))}
              </div>
              
              {/* Prayer status cells (heat map) */}
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {Array.from({ length: daysToShow }).map((_, colIndex) => (
                    <div 
                      key={`${rowIndex}-${colIndex}`} 
                      className="w-8 h-8 flex-shrink-0 flex items-center justify-center"
                    >
                      <Skeleton className="w-6 h-6 rounded" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // GitHub-style Heatmap Render
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
      
      {/* GitHub-style heatmap */}
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
                const date = parseDateStr(day.date);
                const isToday = isSameDay(date, new Date());
                const isFirstOfMonth = date.getDate() === 1;
                const isPreviousDifferentMonth = index > 0 && 
                  date.getMonth() !== parseDateStr(sortedData[index-1].date).getMonth();
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
                  const date = parseDateStr(day.date);
                  const isToday = isSameDay(date, new Date());
                  
                  return (
                    <div 
                      key={`${day.date}-${prayer}`} 
                      className={`w-8 h-8 flex-shrink-0 flex items-center justify-center ${
                        isToday ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div 
                        className={`w-6 h-6 rounded transition-colors ${getStatusColor(status)} hover:scale-110 hover:z-10`}
                        title={`${prayer} on ${format(date, 'MMM d, yyyy')}: ${getStatusText(status)}`}
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
} 