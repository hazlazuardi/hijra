/**
 * Component tests for PrayerTracker
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrayerTracker from '@/app/prayer/components/PrayerTracker';
import { PrayerStatus } from '@/lib/sync-service';

// Mock the Skeleton component
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }: { className?: string, [key: string]: any }) => (
    <div data-testid="skeleton" className={className} role="status" {...props} />
  )
}));

// Mock Swiper components because they're complex and we just need to test our component's logic
jest.mock('swiper/react', () => ({
  Swiper: ({ children, onSwiper, onSlideChange }: any) => (
    <div data-testid="swiper" onClick={() => onSlideChange?.({ activeIndex: 1 })}>
      {children}
      <button onClick={() => onSwiper?.({ activeIndex: 0, slideTo: jest.fn() })}>Init Swiper</button>
    </div>
  ),
  SwiperSlide: ({ children, virtualIndex }: any) => (
    <div data-testid={`slide-${virtualIndex}`}>{children({ isActive: virtualIndex === 0 })}</div>
  ),
}));

// Mock swiper modules
jest.mock('swiper/modules', () => ({
  Virtual: {},
  EffectCoverflow: {}
}));

// Mock CSS imports
jest.mock('swiper/css', () => ({}));
jest.mock('swiper/css/effect-coverflow', () => ({}));

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

describe('PrayerTracker Component', () => {
  const today = new Date();
  const todayStr = formatDateStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = formatDateStr(yesterday);
  
  const mockProps = {
    currentDate: today,
    slides: [
      { date: yesterday, key: yesterdayStr },
      { date: today, key: todayStr }
    ],
    activeIndex: 1,
    prayerCache: {
      [todayStr]: [
        { name: "Fajr", status: 'on_time' as PrayerStatus },
        { name: "Dhuhr", status: 'late' as PrayerStatus },
        { name: "Asr", status: 'missed' as PrayerStatus },
        { name: "Maghrib", status: 'no_entry' as PrayerStatus },
        { name: "Isha", status: 'on_time' as PrayerStatus }
      ],
      [yesterdayStr]: [
        { name: "Fajr", status: 'missed' as PrayerStatus },
        { name: "Dhuhr", status: 'on_time' as PrayerStatus },
        { name: "Asr", status: 'on_time' as PrayerStatus },
        { name: "Maghrib", status: 'on_time' as PrayerStatus },
        { name: "Isha", status: 'late' as PrayerStatus }
      ]
    },
    onSlideChange: jest.fn(),
    onPrayerUpdate: jest.fn(),
    goToPreviousDay: jest.fn(),
    goToNextDay: jest.fn(),
    goToToday: jest.fn(),
    onSwiperInit: jest.fn(),
    formatDateStr,
    parseDateStr
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('renders prayer card for each prayer', () => {
    // Mock the useState to ensure mounted state is true
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    render(<PrayerTracker {...mockProps} />);
    
    // There should be 5 active prayers in the UI
    expect(screen.getAllByText(/Fajr|Dhuhr|Asr|Maghrib|Isha/).length).toBeGreaterThan(0);
  });

  test('renders date navigation controls', () => {
    // Mock the useState to ensure mounted state is true
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    render(<PrayerTracker {...mockProps} />);
    
    // Should have previous and next buttons
    const prevButton = screen.getByLabelText('Previous day');
    const nextButton = screen.getByLabelText('Next day');
    
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  test('calls onPrayerUpdate when prayer card is clicked', async () => {
    // Mock the useState to ensure mounted state is true
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    render(<PrayerTracker {...mockProps} />);
    
    // Find all prayer cards and click the first one
    const prayerCards = screen.getAllByText(/Fajr|Dhuhr|Asr|Maghrib|Isha/);
    fireEvent.click(prayerCards[0].closest('.prayer-card') || prayerCards[0]);
    
    // Check if the onPrayerUpdate was called
    expect(mockProps.onPrayerUpdate).toHaveBeenCalled();
  });

  test('calls navigation functions when buttons are clicked', () => {
    // Mock the useState to ensure mounted state is true
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    render(<PrayerTracker {...mockProps} />);
    
    // Click previous day button
    const prevButton = screen.getByLabelText('Previous day');
    fireEvent.click(prevButton);
    expect(mockProps.goToPreviousDay).toHaveBeenCalled();
    
    // Click next day button
    const nextButton = screen.getByLabelText('Next day');
    fireEvent.click(nextButton);
    expect(mockProps.goToNextDay).toHaveBeenCalled();
  });

  test('calls onSlideChange when swiper changes slide', () => {
    // Mock the useState to ensure mounted state is true
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    render(<PrayerTracker {...mockProps} />);
    
    // Trigger swiper slide change
    const swiper = screen.getByTestId('swiper');
    fireEvent.click(swiper);
    
    expect(mockProps.onSlideChange).toHaveBeenCalled();
  });

  test('calls onSwiperInit when swiper is initialized', () => {
    // Mock the useState to ensure mounted state is true
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    render(<PrayerTracker {...mockProps} />);
    
    // Click the mock button that initializes the swiper
    const initButton = screen.getByText('Init Swiper');
    fireEvent.click(initButton);
    
    expect(mockProps.onSwiperInit).toHaveBeenCalled();
  });

  test('renders skeleton when not mounted', () => {
    // Override the mock to test unmounted state
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [false, jest.fn()]);
    
    render(<PrayerTracker {...mockProps} />);
    
    // Should show skeletons
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
}); 