"use client";

import { createClient } from "@/utils/supabase/client";
import * as idb from './indexdb';
import { useAuthStore } from './store/authStore';
import { v4 as uuidv4 } from 'uuid';

// Prayer status types
export type PrayerStatus = 'on_time' | 'late' | 'missed' | 'no_entry';

// Default prayers array for reuse
const DEFAULT_PRAYERS = [
  { name: "Fajr", status: 'no_entry' as PrayerStatus },
  { name: "Dhuhr", status: 'no_entry' as PrayerStatus },
  { name: "Asr", status: 'no_entry' as PrayerStatus },
  { name: "Maghrib", status: 'no_entry' as PrayerStatus },
  { name: "Isha", status: 'no_entry' as PrayerStatus }
];

// Get the next status in the cycle
export const getNextPrayerStatus = (currentStatus: PrayerStatus): PrayerStatus => {
  const statusCycle: PrayerStatus[] = ['on_time', 'late', 'missed', 'no_entry'];
  const currentIndex = statusCycle.indexOf(currentStatus);
  const nextIndex = (currentIndex + 1) % statusCycle.length;
  return statusCycle[nextIndex];
};

// Convert UI status to Supabase status
export const mapCompletedToStatus = (completed: boolean | PrayerStatus): PrayerStatus => {
  if (typeof completed === 'boolean') {
    return completed ? 'on_time' : 'no_entry';
  }
  return completed as PrayerStatus;
};

// Prayer time enum values
type PrayerTime = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

// Initialize IndexedDB when the app loads
export const initializeDB = async () => {
  try {
    await idb.initDB();
    console.log("IndexedDB initialized");
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);
  }
};

// Debounce function to prevent excessive syncing
const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
): ((...args: Parameters<F>) => Promise<ReturnType<F>>) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    return new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        resolve(func(...args));
      }, waitFor);
    });
  };
};

// Debounced sync function to prevent excessive API calls
const debouncedSync = debounce(syncPrayers, 2000);

// Save prayer data locally
export const savePrayerOffline = async (
  userId: string, 
  date: string, 
  prayers: Array<{ name: string; status: PrayerStatus; time?: string }>
) => {
  try {
    if (!userId || !date) {
      console.error("Missing required parameters for savePrayerOffline");
      return false;
    }
    
    console.log(`Saving prayers for date: ${date}`);
    const existingPrayers = await idb.getPrayersByDate(date, userId);
    const now = new Date().toISOString();
    
    if (existingPrayers.length > 0) {
      // Update existing record
      const prayer = existingPrayers[0];
      prayer.prayers = prayers;
      prayer.updatedAt = now;
      prayer.synced = false;
      
      await idb.addPrayer(prayer);
    } else {
      // Create new record
      const newPrayer = {
        id: uuidv4(),
        userId,
        date,
        prayers,
        createdAt: now,
        updatedAt: now,
        synced: false
      };
      
      await idb.addPrayer(newPrayer);
    }
    
    // Update last sync time in auth store
    useAuthStore.getState().setOfflineData('lastPrayerSave', now);
    
    // Try to sync if online using debounced sync
    if (useAuthStore.getState().isOnline) {
      debouncedSync();
    }
    
    return true;
  } catch (error) {
    console.error("Error saving prayer offline:", error);
    return false;
  }
};

// Sync prayers with the server
export async function syncPrayers() {
  if (!useAuthStore.getState().isOnline) {
    console.log("Cannot sync prayers: offline");
    return false;
  }
  
  try {
    const supabase = createClient();
    const unsynced = await idb.getUnsyncedPrayers();
    
    if (unsynced.length === 0) {
      console.log("No unsynced prayers to sync");
      return true;
    }
    
    // Process each prayer individually and upload to Supabase
    for (const prayer of unsynced) {
      const { id, userId, date, prayers, createdAt } = prayer;
      
      if (!date || !userId) {
        console.error("Date or userId is undefined, skipping sync");
        continue;
      }
      
      console.log(`Syncing prayers for date: ${date}`);
      
      // Batch update approach - prepare all operations
      const operations = prayers.map(prayerItem => {
        // Map the prayer name to ensure it's a valid enum value
        const prayerTime = prayerItem.name.toLowerCase() as PrayerTime;
        const prayerStatus = prayerItem.status;
        
        return {
          prayerTime,
          prayerStatus,
          check: () => supabase
            .from('prayer_tracker')
            .select()
            .eq('prayer_date', date)
            .eq('user_id', userId)
            .eq('prayer_time', prayerTime)
            .single(),
          update: (id: string) => supabase
            .from('prayer_tracker')
            .update({
              prayer_status: prayerStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', id),
          insert: () => supabase
            .from('prayer_tracker')
            .insert({
              user_id: userId,
              prayer_date: date,
              prayer_time: prayerTime,
              prayer_status: prayerStatus,
              created_at: createdAt,
              updated_at: new Date().toISOString()
            })
        };
      });
      
      // Execute operations with proper error handling
      for (const op of operations) {
        try {
          const { data: existingData, error: fetchError } = await op.check();
          
          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error(`Error checking prayer record for ${op.prayerTime}:`, fetchError);
            continue;
          }
          
          let result;
          
          if (existingData) {
            // Update existing record
            result = await op.update(existingData.id);
          } else {
            // Insert new record
            result = await op.insert();
          }
          
          if (result.error) {
            console.error(`Error syncing ${op.prayerTime} prayer:`, result.error);
          }
        } catch (error) {
          console.error(`Error processing prayer ${op.prayerTime}:`, error);
        }
      }
      
      // Mark local prayer data as synced after all individual prayers are processed
      await idb.markAsSynced('prayers', id);
    }
    
    return true;
  } catch (error) {
    console.error("Error syncing prayers:", error);
    return false;
  }
}

// Fetch prayers (from IndexedDB first, then server if online)
export const fetchPrayers = async (userId: string, date: string) => {
  try {
    if (!userId || !date) {
      console.error("Missing required parameters for fetchPrayers");
      return [...DEFAULT_PRAYERS];
    }
    
    console.log(`Fetching prayers for date: ${date}`);
    
    // First try to get from IndexedDB
    const localPrayers = await idb.getPrayersByDate(date, userId);
    
    // If online, also try to fetch from server and merge/update
    if (useAuthStore.getState().isOnline) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('prayer_tracker')
        .select()
        .eq('prayer_date', date)
        .eq('user_id', userId);
        
      if (error) {
        console.error("Error fetching prayers from server:", error);
      } else if (data && data.length > 0) {
        // Server has data for this date, transform it to our local format
        const prayerMap: Record<string, { name: string, status: PrayerStatus, time?: string }> = {
          fajr: { name: "Fajr", status: 'no_entry' },
          dhuhr: { name: "Dhuhr", status: 'no_entry' },
          asr: { name: "Asr", status: 'no_entry' },
          maghrib: { name: "Maghrib", status: 'no_entry' },
          isha: { name: "Isha", status: 'no_entry' }
        };
        
        // Update the map with server data
        data.forEach(prayer => {
          const prayerTime = prayer.prayer_time.toLowerCase();
          prayerMap[prayerTime] = {
            name: prayerTime.charAt(0).toUpperCase() + prayerTime.slice(1),
            status: prayer.prayer_status as PrayerStatus,
            time: prayer.updated_at
          };
        });
        
        // Convert the map to an array
        const serverPrayers = Object.values(prayerMap);
        
        // If we have local data, decide whether to use local or server
        if (localPrayers.length > 0) {
          const localPrayer = localPrayers[0];
          
          // Only update local if the server data is newer or if local is not yet synced
          if (!localPrayer.synced) {
            // Local data needs to be synced, so sync it first
            await syncPrayers();
            return localPrayer.prayers;
          } else {
            // Server data is authoritative, update local
            await idb.addPrayer({
              ...localPrayer,
              prayers: serverPrayers,
              updatedAt: new Date().toISOString(),
              synced: true
            });
            return serverPrayers;
          }
        } else {
          // No local data, store server data locally
          await idb.addPrayer({
            id: uuidv4(),
            userId,
            date,
            prayers: serverPrayers,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            synced: true
          });
          return serverPrayers;
        }
      }
    }
    
    // Return local data if we have it
    if (localPrayers.length > 0) {
      return localPrayers[0].prayers;
    }
    
    // No data found, return default prayers
    return [...DEFAULT_PRAYERS];
  } catch (error) {
    console.error("Error fetching prayers:", error);
    // Return default prayers on error
    return [...DEFAULT_PRAYERS];
  }
};

// Get recent prayer data for the last n days
export const getRecentPrayers = async (userId: string, days: number = 7) => {
  try {
    if (!userId) {
      console.error("Missing userId for getRecentPrayers");
      return [];
    }
    
    const dates: string[] = [];
    const today = new Date();
    
    // Generate array of dates for the last n days
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Fetch prayers for each date
    const prayersPromises = dates.map(date => idb.getPrayersByDate(date, userId));
    const prayersResults = await Promise.all(prayersPromises);
    
    // Transform results into a more usable format
    return dates.map((date, index) => {
      const prayerData = prayersResults[index];
      if (prayerData.length > 0) {
        return {
          date,
          prayers: prayerData[0].prayers
        };
      }
      return {
        date,
        prayers: [...DEFAULT_PRAYERS]
      };
    });
  } catch (error) {
    console.error("Error fetching recent prayers:", error);
    return [];
  }
};

// Calculate prayer streaks
export const calculatePrayerStreaks = async (userId: string) => {
  try {
    if (!userId) {
      console.error("Missing userId for calculatePrayerStreaks");
      return {
        currentStreak: 0,
        longestStreak: 0,
        completedToday: 0,
        totalCompletedThisWeek: 0,
        prayerStats: {}
      };
    }
    
    // Get recent prayers (last 30 days to calculate streaks)
    const recentPrayers = await getRecentPrayers(userId, 30);
    
    // Calculate current streak
    let currentStreak = 0;
    let i = 0;
    
    // Count completed prayers today
    const todayPrayers = recentPrayers[0]?.prayers || [];
    const completedToday = todayPrayers.filter(p => 
      p.status === 'on_time' || p.status === 'late'
    ).length;
    
    // Count total completed this week
    const thisWeekPrayers = recentPrayers.slice(0, 7);
    let totalCompletedThisWeek = 0;
    
    // Calculate prayer-specific stats
    const prayerStats: Record<string, { completed: number, total: number, streak: number }> = {
      'Fajr': { completed: 0, total: 0, streak: 0 },
      'Dhuhr': { completed: 0, total: 0, streak: 0 },
      'Asr': { completed: 0, total: 0, streak: 0 },
      'Maghrib': { completed: 0, total: 0, streak: 0 },
      'Isha': { completed: 0, total: 0, streak: 0 }
    };
    
    // Process each day's prayers
    while (i < recentPrayers.length) {
      const dayPrayers = recentPrayers[i]?.prayers || [];
      const completedCount = dayPrayers.filter(p => 
        p.status === 'on_time' || p.status === 'late'
      ).length;
      
      // Update prayer-specific stats
      if (i < 7) { // Only count for the last week
        dayPrayers.forEach(prayer => {
          if (prayerStats[prayer.name]) {
            prayerStats[prayer.name].total++;
            if (prayer.status === 'on_time' || prayer.status === 'late') {
              prayerStats[prayer.name].completed++;
              totalCompletedThisWeek++;
            }
          }
        });
      }
      
      // Update current streak
      if (completedCount > 0) {
        currentStreak++;
      } else {
        break;
      }
      
      i++;
    }
    
    // Calculate longest streak
    let longestStreak = 0;
    let currentLongestStreak = 0;
    
    for (const day of recentPrayers) {
      const dayPrayers = day?.prayers || [];
      const completedCount = dayPrayers.filter(p => 
        p.status === 'on_time' || p.status === 'late'
      ).length;
      
      if (completedCount > 0) {
        currentLongestStreak++;
        longestStreak = Math.max(longestStreak, currentLongestStreak);
      } else {
        currentLongestStreak = 0;
      }
    }
    
    // Calculate prayer-specific streaks
    for (const prayerName of Object.keys(prayerStats)) {
      let streak = 0;
      for (let i = 0; i < recentPrayers.length; i++) {
        const prayer = recentPrayers[i]?.prayers.find(p => p.name === prayerName);
        if (prayer && (prayer.status === 'on_time' || prayer.status === 'late')) {
          streak++;
        } else {
          break;
        }
      }
      prayerStats[prayerName].streak = streak;
    }
    
    return {
      currentStreak,
      longestStreak,
      completedToday,
      totalCompletedThisWeek,
      prayerStats
    };
  } catch (error) {
    console.error("Error calculating prayer streaks:", error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      completedToday: 0,
      totalCompletedThisWeek: 0,
      prayerStats: {}
    };
  }
}; 