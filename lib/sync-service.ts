"use client";

import { createClient } from "@/utils/supabase/client";
import * as idb from './indexdb';
import { useAuthStore } from './store/authStore';
import { v4 as uuidv4 } from 'uuid';

// Prayer status types
export type PrayerStatus = 'on_time' | 'late' | 'missed' | 'no_entry';

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

// Save prayer data locally
export const savePrayerOffline = async (
  userId: string, 
  date: string, 
  prayers: Array<{ name: string; status: PrayerStatus; time?: string }>
) => {
  try {
    console.log(`Saving prayers for date: ${date}`);
    const existingPrayers = await idb.getPrayersByDate(date, userId);
    
    if (existingPrayers.length > 0) {
      // Update existing record
      const prayer = existingPrayers[0];
      prayer.prayers = prayers;
      prayer.updatedAt = new Date().toISOString();
      prayer.synced = false;
      
      await idb.addPrayer(prayer);
    } else {
      // Create new record
      const newPrayer = {
        id: uuidv4(),
        userId,
        date,
        prayers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false
      };
      
      await idb.addPrayer(newPrayer);
    }
    
    // Update last sync time in auth store
    useAuthStore.getState().setOfflineData('lastPrayerSave', new Date().toISOString());
    
    // Try to sync if online
    if (useAuthStore.getState().isOnline) {
      await syncPrayers();
    }
    
    return true;
  } catch (error) {
    console.error("Error saving prayer offline:", error);
    return false;
  }
};

// Sync prayers with the server
export const syncPrayers = async () => {
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
      
      console.log(`Syncing prayers for date: ${date}`);
      
      if (!date) {
        console.error("Date is undefined, skipping sync");
        continue;
      }
      
      // For each prayer item, create a separate record in Supabase
      for (const prayerItem of prayers) {
        // Map the prayer name to ensure it's a valid enum value
        const prayerTime = prayerItem.name.toLowerCase() as PrayerTime;
        const prayerStatus = prayerItem.status;
        
        console.log(`Syncing ${prayerTime} prayer with status ${prayerStatus} for date ${date}`);
        
        // Check if this specific prayer already exists
        const { data: existingData, error: fetchError } = await supabase
          .from('prayer_tracker')
          .select()
          .eq('prayer_date', date)
          .eq('user_id', userId)
          .eq('prayer_time', prayerTime)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error(`Error checking prayer record for ${prayerTime}:`, fetchError);
          continue;
        }
        
        let result;
        
        if (existingData) {
          // Update existing record
          result = await supabase
            .from('prayer_tracker')
            .update({
              prayer_status: prayerStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingData.id);
        } else {
          // Insert new record
          result = await supabase
            .from('prayer_tracker')
            .insert({
              user_id: userId,
              prayer_date: date,
              prayer_time: prayerTime,
              prayer_status: prayerStatus,
              created_at: createdAt,
              updated_at: new Date().toISOString()
            });
        }
        
        if (result.error) {
          console.error(`Error syncing ${prayerTime} prayer:`, result.error);
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
};

// Fetch prayers (from IndexedDB first, then server if online)
export const fetchPrayers = async (userId: string, date: string) => {
  try {
    console.log(`Fetching prayers for date: ${date}`);
    if (!date) {
      console.error("Date is undefined");
      return [];
    }
    
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
    return [
      { name: "Fajr", status: 'no_entry' },
      { name: "Dhuhr", status: 'no_entry' },
      { name: "Asr", status: 'no_entry' },
      { name: "Maghrib", status: 'no_entry' },
      { name: "Isha", status: 'no_entry' }
    ];
  } catch (error) {
    console.error("Error fetching prayers:", error);
    // Return default prayers on error
    return [
      { name: "Fajr", status: 'no_entry' },
      { name: "Dhuhr", status: 'no_entry' },
      { name: "Asr", status: 'no_entry' },
      { name: "Maghrib", status: 'no_entry' },
      { name: "Isha", status: 'no_entry' }
    ];
  }
}; 