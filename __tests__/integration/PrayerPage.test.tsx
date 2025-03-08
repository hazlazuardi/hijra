/**
 * Integration tests for the Prayer Page
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrayerStatus } from '@/lib/sync-service';

// Simplified import to avoid requiring the full component during test setup
const PrayerPage = React.lazy(() => import('@/app/prayer/page'));

// Simple mock components to prevent memory leaks
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />
}));

// Mock the PrayerHeatmap and PrayerTracker components with minimal implementations
jest.mock('@/app/prayer/components/PrayerHeatmap', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="prayer-heatmap">Prayer Trends</div>
  };
});

jest.mock('@/app/prayer/components/PrayerTracker', () => {
  return {
    __esModule: true,
    default: ({ onPrayerUpdate }: any) => (
      <div data-testid="prayer-tracker">
        <div>Fajr</div>
        <button 
          data-testid="prayer-card" 
          onClick={() => onPrayerUpdate(new Date(), 0)}
        >
          Prayer Card
        </button>
      </div>
    )
  };
});

// Mock the stores with minimal implementations
jest.mock('@/lib/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user-id' },
    checkUser: jest.fn(),
    isOnline: true
  })
}));

jest.mock('@/lib/store/navStore', () => ({
  useNavStore: () => ({
    setActiveSection: jest.fn()
  })
}));

// Mock the sync service with minimal implementations
jest.mock('@/lib/sync-service', () => {
  return {
    fetchPrayers: jest.fn().mockResolvedValue([
      { name: "Fajr", status: 'on_time' as PrayerStatus }
    ]),
    savePrayerOffline: jest.fn().mockResolvedValue(true),
    getRecentPrayers: jest.fn().mockResolvedValue([]),
    getNextPrayerStatus: (status: PrayerStatus) => 'on_time' as PrayerStatus,
    PrayerStatus: { 'on_time': 'on_time' } // Mock type
  };
});

// Mock swiper components with minimal implementations
jest.mock('swiper/react', () => ({
  Swiper: ({ children }: any) => <div>{children}</div>,
  SwiperSlide: ({ children }: any) => children({ isActive: true })
}));

jest.mock('swiper/modules', () => ({}));
jest.mock('swiper/css', () => ({}));
jest.mock('swiper/css/effect-coverflow', () => ({}));

describe('PrayerPage Integration', () => {
  const syncService = require('@/lib/sync-service');
  
  // Reset DOM and mocks before each test
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  // Clean up after each test
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  // Helper function to render with Suspense
  const renderWithSuspense = () => {
    return render(
      <React.Suspense fallback={<div>Loading...</div>}>
        <PrayerPage />
      </React.Suspense>
    );
  };
  
  test('renders page with title', async () => {
    renderWithSuspense();
    
    // Wait for suspense to resolve
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Verify page title is rendered
    await waitFor(() => {
      expect(screen.getByText('Prayer Tracking')).toBeInTheDocument();
    });
  });
  
  test('loads prayer data on initialization', async () => {
    const fetchSpy = jest.spyOn(syncService, 'fetchPrayers');
    
    renderWithSuspense();
    
    // Wait for suspense to resolve
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should call fetchPrayers during initialization
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });
  });
  
  test('calls savePrayerOffline when prayer card is clicked', async () => {
    const saveSpy = jest.spyOn(syncService, 'savePrayerOffline');
    
    renderWithSuspense();
    
    // Wait for suspense to resolve
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Wait for tracker to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('prayer-tracker')).toBeInTheDocument();
    });
    
    // Find and click the prayer card
    const prayerCard = screen.getByTestId('prayer-card');
    fireEvent.click(prayerCard);
    
    // Check if the save function was called
    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalled();
    });
  });
}); 