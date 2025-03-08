/**
 * Unit tests for prayer status utility functions
 */

import { getNextPrayerStatus, PrayerStatus, mapCompletedToStatus } from "@/lib/sync-service";

describe('Prayer Status Utility Functions', () => {
  describe('getNextPrayerStatus', () => {
    test('cycles through statuses in the correct order', () => {
      expect(getNextPrayerStatus('on_time')).toBe('late');
      expect(getNextPrayerStatus('late')).toBe('missed');
      expect(getNextPrayerStatus('missed')).toBe('no_entry');
      expect(getNextPrayerStatus('no_entry')).toBe('on_time');
    });

    test('returns a valid status for invalid input', () => {
      // @ts-ignore - Testing with invalid input
      expect(['on_time', 'late', 'missed', 'no_entry']).toContain(getNextPrayerStatus('invalid_status'));
    });
  });

  describe('mapCompletedToStatus', () => {
    test('maps boolean true to on_time', () => {
      expect(mapCompletedToStatus(true)).toBe('on_time');
    });

    test('maps boolean false to no_entry', () => {
      expect(mapCompletedToStatus(false)).toBe('no_entry');
    });

    test('passes through existing PrayerStatus values', () => {
      expect(mapCompletedToStatus('on_time')).toBe('on_time');
      expect(mapCompletedToStatus('late')).toBe('late');
      expect(mapCompletedToStatus('missed')).toBe('missed');
      expect(mapCompletedToStatus('no_entry')).toBe('no_entry');
    });
  });
}); 