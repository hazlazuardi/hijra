import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { PrayerStatus } from './sync-service';

interface HijraDB extends DBSchema {
  prayers: {
    key: string;
    value: {
      id: string;
      userId: string;
      date: string; // This is the prayer_date in Supabase
      prayers: Array<{
        name: string; // This maps to prayer_time enum
        status: PrayerStatus; // This maps to prayer_status enum
        time?: string;
      }>;
      createdAt: string;
      updatedAt: string;
      synced: boolean;
    };
    indexes: { 'by-date': string; 'by-user': string };
  };
  quran: {
    key: string;
    value: {
      id: string;
      userId: string;
      surah: number;
      ayah: number;
      lastRead: string;
      synced: boolean;
    };
    indexes: { 'by-user': string };
  };
  fasting: {
    key: string;
    value: {
      id: string;
      userId: string;
      date: string;
      completed: boolean;
      notes: string;
      synced: boolean;
    };
    indexes: { 'by-date': string; 'by-user': string };
  };
}

let dbPromise: Promise<IDBPDatabase<HijraDB>> | null = null;

export const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<HijraDB>('hijra-app', 1, {
      upgrade(db) {
        // Create prayers store
        const prayerStore = db.createObjectStore('prayers', { keyPath: 'id' });
        prayerStore.createIndex('by-date', 'date');
        prayerStore.createIndex('by-user', 'userId');

        // Create quran store
        const quranStore = db.createObjectStore('quran', { keyPath: 'id' });
        quranStore.createIndex('by-user', 'userId');

        // Create fasting store
        const fastingStore = db.createObjectStore('fasting', { keyPath: 'id' });
        fastingStore.createIndex('by-date', 'date');
        fastingStore.createIndex('by-user', 'userId');
      },
    });
  }
  return dbPromise;
};

// Prayer functions
export const addPrayer = async (prayer: HijraDB['prayers']['value']) => {
  const db = await initDB();
  return db.put('prayers', prayer);
};

export const getPrayers = async (userId: string) => {
  const db = await initDB();
  return db.getAllFromIndex('prayers', 'by-user', userId);
};

export const getPrayersByDate = async (date: string, userId: string) => {
  const db = await initDB();
  const prayers = await db.getAllFromIndex('prayers', 'by-date', date);
  return prayers.filter(prayer => prayer.userId === userId);
};

export const getUnsyncedPrayers = async () => {
  const db = await initDB();
  const prayers = await db.getAll('prayers');
  return prayers.filter(prayer => !prayer.synced);
};

// Quran functions
export const addQuranProgress = async (progress: HijraDB['quran']['value']) => {
  const db = await initDB();
  return db.put('quran', progress);
};

export const getQuranProgress = async (userId: string) => {
  const db = await initDB();
  const progress = await db.getAllFromIndex('quran', 'by-user', userId);
  return progress.length > 0 ? progress[0] : null;
};

// Fasting functions
export const addFasting = async (fasting: HijraDB['fasting']['value']) => {
  const db = await initDB();
  return db.put('fasting', fasting);
};

export const getFastingByDate = async (date: string, userId: string) => {
  const db = await initDB();
  const fastings = await db.getAllFromIndex('fasting', 'by-date', date);
  return fastings.filter(fasting => fasting.userId === userId);
};

export const getUnsyncedFastings = async () => {
  const db = await initDB();
  const fastings = await db.getAll('fasting');
  return fastings.filter(fasting => !fasting.synced);
};

// General sync functions
export const markAsSynced = async (
  storeName: 'prayers' | 'quran' | 'fasting',
  id: string
) => {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const item = await store.get(id);
  
  if (item) {
    item.synced = true;
    await store.put(item);
  }
  
  return tx.done;
}; 