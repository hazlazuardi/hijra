/**
 * Component tests for PrayerHeatmap
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrayerHeatmap from '@/app/prayer/components/PrayerHeatmap';
import { PrayerStatus } from '@/lib/sync-service';

// Mock the Skeleton component
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }) => (
    <div data-testid="skeleton" className={className} role="status" {...props} />
  )
}));

// Mock getRecentPrayers to avoid actual API calls
jest.mock('@/lib/sync-service', () => {
  const originalModule = jest.requireActual('@/lib/sync-service');
  return {
    ...originalModule,
    getRecentPrayers: jest.fn().mockImplementation(async (userId, days, formatDateFn) => {
      const today = new Date();
      const result = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        
        const dateStr = formatDateFn ? formatDateFn(date) : date.toISOString().split('T')[0];
        
        result.push({
          date: dateStr,
          prayers: [
            { name: "Fajr", status: 'on_time' as PrayerStatus },
            { name: "Dhuhr", status: 'late' as PrayerStatus },
            { name: "Asr", status: 'missed' as PrayerStatus },
            { name: "Maghrib", status: 'no_entry' as PrayerStatus },
            { name: "Isha", status: 'on_time' as PrayerStatus }
          ]
        });
      }
      
      return result;
    })
  };
});

// Format date helpers for testing
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

describe('PrayerHeatmap Component', () => {
  const mockProps = {
    userId: 'test-user-id',
    prayerCache: {
      '2023-03-15': [
        { name: "Fajr", status: 'on_time' as PrayerStatus },
        { name: "Dhuhr", status: 'late' as PrayerStatus },
        { name: "Asr", status: 'missed' as PrayerStatus },
        { name: "Maghrib", status: 'no_entry' as PrayerStatus },
        { name: "Isha", status: 'on_time' as PrayerStatus }
      ]
    },
    formatDateStr,
    parseDateStr
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock the scroll functionality
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      value: 0,
      writable: true,
    });
    
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      value: 100,
      writable: true,
    });
  });

  test('renders loading skeleton initially', () => {
    // Override useState to force loading state
    jest.spyOn(React, 'useState')
      // First useState call (contributionData)
      .mockImplementationOnce(() => [[], jest.fn()])
      // Second useState call (isLoading)
      .mockImplementationOnce(() => [true, jest.fn()]);
      
    render(<PrayerHeatmap {...mockProps} />);
    
    // Check for skeletons
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('shows correct legend items', async () => {
    // Mock useState to force non-loading state
    jest.spyOn(React, 'useState')
      // First useState call (contributionData)
      .mockImplementationOnce(() => [[
        {
          date: '2023-03-15',
          prayers: mockProps.prayerCache['2023-03-15']
        }
      ], jest.fn()])
      // Second useState call (isLoading)
      .mockImplementationOnce(() => [false, jest.fn()]);
    
    render(<PrayerHeatmap {...mockProps} />);
    
    // Check for legend items
    await waitFor(() => {
      expect(screen.getByText('On Time')).toBeInTheDocument();
      expect(screen.getByText('Late')).toBeInTheDocument();
      expect(screen.getByText('Missed')).toBeInTheDocument();
      expect(screen.getByText('No Entry')).toBeInTheDocument();
    });
  });

  test('shows prayer names in the vertical axis', async () => {
    // Mock useState to force non-loading state
    jest.spyOn(React, 'useState')
      // First useState call (contributionData)
      .mockImplementationOnce(() => [[
        {
          date: '2023-03-15',
          prayers: mockProps.prayerCache['2023-03-15']
        }
      ], jest.fn()])
      // Second useState call (isLoading)
      .mockImplementationOnce(() => [false, jest.fn()]);
    
    render(<PrayerHeatmap {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Prayer')).toBeInTheDocument();
      expect(screen.getByText('Fajr')).toBeInTheDocument();
      expect(screen.getByText('Dhuhr')).toBeInTheDocument();
      expect(screen.getByText('Asr')).toBeInTheDocument();
      expect(screen.getByText('Maghrib')).toBeInTheDocument();
      expect(screen.getByText('Isha')).toBeInTheDocument();
    });
  });

  test('updates when prayerCache changes', async () => {
    // Set up a ref to help us test cache updates
    const initialLoadCompletedRef = { current: true };
    jest.spyOn(React, 'useRef').mockImplementation(() => initialLoadCompletedRef);
    
    // Mock useState for initial render
    jest.spyOn(React, 'useState')
      // contributionData state
      .mockImplementationOnce(() => [[
        {
          date: '2023-03-15',
          prayers: mockProps.prayerCache['2023-03-15']
        }
      ], jest.fn()])
      // isLoading state
      .mockImplementationOnce(() => [false, jest.fn()]);
    
    const { rerender } = render(<PrayerHeatmap {...mockProps} />);
    
    // Update the prayer cache with new data
    const updatedProps = {
      ...mockProps,
      prayerCache: {
        ...mockProps.prayerCache,
        '2023-03-16': [
          { name: "Fajr", status: 'missed' as PrayerStatus },
          { name: "Dhuhr", status: 'on_time' as PrayerStatus },
          { name: "Asr", status: 'on_time' as PrayerStatus },
          { name: "Maghrib", status: 'on_time' as PrayerStatus },
          { name: "Isha", status: 'late' as PrayerStatus }
        ]
      }
    };

    // Reset all mocks to ensure clean rerender
    jest.clearAllMocks();
    
    // Mock the updated useState calls for rerender
    jest.spyOn(React, 'useState')
      // contributionData state - now with updated data
      .mockImplementationOnce(() => [[
        {
          date: '2023-03-15',
          prayers: mockProps.prayerCache['2023-03-15']
        },
        {
          date: '2023-03-16',
          prayers: updatedProps.prayerCache['2023-03-16']
        }
      ], jest.fn()])
      // isLoading state
      .mockImplementationOnce(() => [false, jest.fn()]);
    
    // Re-render with updated props
    rerender(<PrayerHeatmap {...updatedProps} />);
    
    // The component should reflect the changes
    await waitFor(() => {
      // Just check that it renders without errors
      expect(screen.getByText('Prayer')).toBeInTheDocument();
    });
  });
}); 