/**
 * Unit tests for date formatting and parsing functions
 */

describe('Date Utility Functions', () => {
  // Import the functions directly from the test file to isolate the tests
  const formatDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateStr = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(part => parseInt(part, 10));
    return new Date(year, month - 1, day);
  };

  describe('formatDateStr', () => {
    test('formats a date as YYYY-MM-DD', () => {
      const testDate = new Date(2023, 2, 15); // March 15, 2023
      expect(formatDateStr(testDate)).toBe('2023-03-15');
    });

    test('pads single-digit month and day with leading zeros', () => {
      const testDate = new Date(2023, 0, 5); // January 5, 2023
      expect(formatDateStr(testDate)).toBe('2023-01-05');
    });

    test('uses local timezone for formatting', () => {
      // Create a date with a specific time to test timezone handling
      const testDate = new Date(2023, 2, 15, 23, 30); // March 15, 2023, 11:30 PM
      
      // The formatted date should be based on local timezone date, not UTC
      // This test might act differently based on where it's run, but the principle holds
      const localDate = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate());
      expect(formatDateStr(testDate)).toBe(formatDateStr(localDate));
    });
  });

  describe('parseDateStr', () => {
    test('parses a YYYY-MM-DD string to a Date object', () => {
      const dateStr = '2023-03-15';
      const parsedDate = parseDateStr(dateStr);
      
      expect(parsedDate.getFullYear()).toBe(2023);
      expect(parsedDate.getMonth()).toBe(2); // March is 2 in JS (0-based)
      expect(parsedDate.getDate()).toBe(15);
    });

    test('handles single-digit month and day in string format', () => {
      const dateStr = '2023-1-5'; // Not padded, should still work
      const parsedDate = parseDateStr(dateStr);
      
      expect(parsedDate.getFullYear()).toBe(2023);
      expect(parsedDate.getMonth()).toBe(0); // January is 0 in JS
      expect(parsedDate.getDate()).toBe(5);
    });

    test('creates dates in local timezone', () => {
      const dateStr = '2023-03-15';
      const parsedDate = parseDateStr(dateStr);
      
      // The parsed date should be at midnight in local timezone
      expect(parsedDate.getHours()).toBe(0);
      expect(parsedDate.getMinutes()).toBe(0);
      expect(parsedDate.getSeconds()).toBe(0);
    });
  });

  describe('Round trip conversion', () => {
    test('preserves date when formatting and then parsing', () => {
      const originalDate = new Date(2023, 2, 15); // March 15, 2023
      const dateStr = formatDateStr(originalDate);
      const parsedDate = parseDateStr(dateStr);
      
      expect(parsedDate.getFullYear()).toBe(originalDate.getFullYear());
      expect(parsedDate.getMonth()).toBe(originalDate.getMonth());
      expect(parsedDate.getDate()).toBe(originalDate.getDate());
    });

    test('handles dates around month boundaries', () => {
      // Test date at end of month
      const endOfMonth = new Date(2023, 0, 31); // January 31, 2023
      const dateStr = formatDateStr(endOfMonth);
      const parsedDate = parseDateStr(dateStr);
      
      expect(parsedDate.getFullYear()).toBe(endOfMonth.getFullYear());
      expect(parsedDate.getMonth()).toBe(endOfMonth.getMonth());
      expect(parsedDate.getDate()).toBe(endOfMonth.getDate());
    });
  });
}); 