"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { fetchPrayers, savePrayerOffline, getNextPrayerStatus, PrayerStatus } from "@/lib/sync-service";
import { useNavStore } from "@/lib/store/navStore";

// Prayer status styling
const statusStyles = {
  'on_time': {
    container: "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700",
    icon: "bg-green-500 text-white border-green-500"
  },
  'late': {
    container: "bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700",
    icon: "bg-amber-500 text-white border-amber-500"
  },
  'missed': {
    container: "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700",
    icon: "bg-red-500 text-white border-red-500"
  },
  'no_entry': {
    container: "bg-card border-border/50",
    icon: "border-muted-foreground/30"
  }
};

// Prayer status descriptions
const statusDescriptions = {
  'on_time': "Prayed on time",
  'late': "Prayed late",
  'missed': "Missed",
  'no_entry': "Not recorded"
};

export default function ProtectedPrayerPage() {
  const { user, isLoggedIn, isOnline } = useAuthStore();
  const { setActiveSection } = useNavStore();
  const [prayers, setPrayers] = useState<Array<{ name: string; status: PrayerStatus; time?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Update active section for navbar
  useEffect(() => {
    setActiveSection('prayer');
  }, [setActiveSection]);

  // Load prayer data
  useEffect(() => {
    if (!user) return;
    
    const loadPrayers = async () => {
      setIsLoading(true);
      
      try {
        console.log(`Loading prayers for date: ${date}`);
        const prayerData = await fetchPrayers(user.id, date);
        setPrayers(prayerData as Array<{ name: string; status: PrayerStatus; time?: string }>);
      } catch (error) {
        console.error("Error loading prayers:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPrayers();
  }, [user, date]);

  // Handle prayer status cycle
  const cyclePrayerStatus = async (index: number) => {
    if (!user) return;
    
    const updatedPrayers = [...prayers];
    const currentStatus = updatedPrayers[index].status;
    const nextStatus = getNextPrayerStatus(currentStatus);
    
    updatedPrayers[index].status = nextStatus;
    updatedPrayers[index].time = nextStatus !== 'no_entry' 
      ? new Date().toISOString() 
      : undefined;
    
    setPrayers(updatedPrayers);
    
    // Save to IndexedDB (and sync if online)
    await savePrayerOffline(user.id, date, updatedPrayers);
  };

  // Handle date change
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    setDate(newDate);
  };

  // Get icon for prayer status
  const getStatusIcon = (status: PrayerStatus) => {
    switch (status) {
      case 'on_time':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        );
      case 'late':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        );
      case 'missed':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-4xl font-bold mb-4">Prayer Tracking</h1>
        <p className="text-muted-foreground">Please sign in to track your prayers</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center max-w-md mx-auto px-4">
      <h1 className="text-3xl font-bold mb-2">Prayer Tracking</h1>
      <div className="text-sm text-muted-foreground mb-6">
        {isOnline ? (
          <span className="text-green-500">Online - Changes will sync automatically</span>
        ) : (
          <span className="text-amber-500">Offline - Changes will sync when online</span>
        )}
      </div>
      
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center">
          <label htmlFor="date" className="text-sm font-medium">Select Date:</label>
          <input 
            type="date" 
            id="date"
            value={date} 
            onChange={handleDateChange}
            className="rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs mb-6">
          {Object.entries(statusDescriptions).map(([status, description]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${statusStyles[status as PrayerStatus].icon}`}></div>
              <span>{description}</span>
            </div>
          ))}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3 w-full">
            {prayers.map((prayer, index) => (
              <div 
                key={prayer.name}
                className={`p-4 rounded-lg border flex justify-between items-center cursor-pointer transition-colors ${
                  statusStyles[prayer.status].container
                }`}
                onClick={() => cyclePrayerStatus(index)}
              >
                <div>
                  <h3 className="font-medium">{prayer.name}</h3>
                  {prayer.time && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(prayer.time).toLocaleTimeString()}
                    </p>
                  )}
                  <p className="text-xs mt-1">{statusDescriptions[prayer.status]}</p>
                </div>
                
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                  statusStyles[prayer.status].icon
                }`}>
                  {getStatusIcon(prayer.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
