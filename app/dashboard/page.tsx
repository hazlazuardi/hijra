'use client';

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useNavStore } from "@/lib/store/navStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Moon, BookOpen, Sunrise, Flame, Award, Calendar, Clock, TrendingUp, BarChart, ChevronRight } from "lucide-react";
import { calculatePrayerStreaks, getRecentPrayers, PrayerStatus } from "@/lib/sync-service";
import { format, subDays, eachDayOfInterval } from "date-fns";

// Visual streak calendar component
const StreakCalendar = ({ userId }: { userId: string }) => {
  const [calendarData, setCalendarData] = useState<Array<{
    date: string;
    completedCount: number;
    level: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load calendar data
  useEffect(() => {
    const loadCalendarData = async () => {
      setIsLoading(true);
      try {
        // Get prayer data for the last 30 days
        const recentPrayers = await getRecentPrayers(userId, 30);
        
        // Transform data for the calendar
        const transformedData = recentPrayers.map(day => {
          const completedCount = day.prayers.filter(
            prayer => prayer.status === 'on_time' || prayer.status === 'late'
          ).length;
          
          // Calculate level based on completed count
          // 0: no prayers, 1: 1 prayer, 2: 2-3 prayers, 3: 4 prayers, 4: all 5 prayers
          let level = 0;
          if (completedCount === 1) level = 1;
          else if (completedCount >= 2 && completedCount <= 3) level = 2;
          else if (completedCount === 4) level = 3;
          else if (completedCount === 5) level = 4;
          
          return {
            date: day.date,
            completedCount,
            level
          };
        });
        
        setCalendarData(transformedData);
      } catch (error) {
        console.error("Error loading calendar data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCalendarData();
  }, [userId]);
  
  // Get color for level
  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100 dark:bg-gray-800';
      case 1: return 'bg-green-200 dark:bg-green-900/40';
      case 2: return 'bg-green-300 dark:bg-green-800/60';
      case 3: return 'bg-green-400 dark:bg-green-700/80';
      case 4: return 'bg-green-500 dark:bg-green-600';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Generate last 7 days for display
  const last7Days = calendarData.slice(0, 7).reverse();
  
  return (
    <div className="w-full">
      <div className="flex flex-col space-y-2">
        {/* Last 7 days streak */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Last 7 Days</h3>
          <Link href="/prayer" className="text-xs text-primary flex items-center">
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
        
        <div className="flex justify-between">
          {last7Days.map((day, index) => {
            const date = new Date(day.date);
            return (
              <div key={day.date} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-md ${getLevelColor(day.level)} flex items-center justify-center mb-1`}>
                  <span className="text-xs font-medium">{day.completedCount}</span>
                </div>
                <div className="text-xs text-muted-foreground">{format(date, 'EEE')}</div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex justify-end items-center mt-2 text-xs text-muted-foreground">
          <span className="mr-2">0</span>
          <div className={`w-3 h-3 rounded-sm ${getLevelColor(0)}`}></div>
          <div className={`w-3 h-3 rounded-sm ${getLevelColor(1)} ml-1`}></div>
          <div className={`w-3 h-3 rounded-sm ${getLevelColor(2)} ml-1`}></div>
          <div className={`w-3 h-3 rounded-sm ${getLevelColor(3)} ml-1`}></div>
          <div className={`w-3 h-3 rounded-sm ${getLevelColor(4)} ml-1`}></div>
          <span className="ml-2">5</span>
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { user, isLoggedIn, checkUser } = useAuthStore();
  const { setActiveSection } = useNavStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [streaks, setStreaks] = useState({
    currentStreak: 0,
    longestStreak: 0,
    completedToday: 0,
    totalCompletedThisWeek: 0,
    prayerStats: {} as Record<string, { completed: number; total: number; streak: number }>
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const userData = await checkUser();
      setMounted(true);
      
      // If we've verified auth state and user is not logged in, redirect
      if (!userData) {
        router.replace('/sign-in');
      }
    };
    
    checkAuth();
  }, [checkUser, router]);

  // Update active section for navbar
  useEffect(() => {
    setActiveSection('dashboard');
  }, [setActiveSection]);

  // Load prayer streaks
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    
    const loadStreaks = async () => {
      setIsLoadingStats(true);
      try {
        const streakData = await calculatePrayerStreaks(user.id);
        setStreaks(streakData);
      } catch (error) {
        console.error("Error loading streaks:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    loadStreaks();
  }, [user, isLoggedIn]);

  // Show loading state if not mounted yet
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Redirect to sign in if not logged in
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Redirecting to sign in...</p>
      </div>
    );
  }

  // Calculate completion percentage for the week
  const weeklyCompletionPercentage = Math.round((streaks.totalCompletedThisWeek / (7 * 5)) * 100);

  return (
    <div className="flex flex-col items-center justify-start max-w-md mx-auto w-full px-4 pb-24">
      <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
      <p className="text-muted-foreground text-center mb-8">
        {user?.email || 'User'}
      </p>
      
      {/* Streak Overview */}
      <div className="w-full mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Prayer Streaks</h2>
        
        {isLoadingStats ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-2">
                  <Flame className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold">{streaks.currentStreak}</h3>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                  <Award className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold">{streaks.longestStreak}</h3>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                  <Calendar className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold">{streaks.completedToday}/5</h3>
                <p className="text-sm text-muted-foreground">Today's Prayers</p>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-2">
                  <BarChart className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold">{weeklyCompletionPercentage}%</h3>
                <p className="text-sm text-muted-foreground">Weekly Completion</p>
              </div>
            </Card>
          </div>
        )}
      </div>
      
      {/* Visual Streak Calendar */}
      {!isLoadingStats && user && (
        <div className="w-full mb-8">
          <h2 className="text-xl font-semibold mb-4">Prayer Activity</h2>
          <Card className="p-4">
            <StreakCalendar userId={user.id} />
          </Card>
        </div>
      )}
      
      {/* Prayer-specific Streaks */}
      {!isLoadingStats && (
        <div className="w-full mb-8">
          <h2 className="text-xl font-semibold mb-4">Prayer-Specific Streaks</h2>
          <Card className="p-4">
            <div className="space-y-3">
              {Object.entries(streaks.prayerStats).map(([prayer, stats]) => (
                <div key={prayer} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Moon className="h-4 w-4 text-primary" />
                    </div>
                    <span>{prayer}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">{stats.streak}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">{stats.completed}/{stats.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      
      {/* Activities */}
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-4">Your Activities</h2>
        
        <div className="grid grid-cols-1 gap-4">
          <Link href="/prayer">
            <Card className="p-4 hover:bg-primary/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Moon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Prayer Tracking</h3>
                  <p className="text-sm text-muted-foreground">Track your daily prayers</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link href="/quran">
            <Card className="p-4 hover:bg-primary/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Quran Reading</h3>
                  <p className="text-sm text-muted-foreground">Track your Quran progress</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link href="/fasting">
            <Card className="p-4 hover:bg-primary/5 transition-colors opacity-60">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Sunrise className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Fasting (Coming Soon)</h3>
                  <p className="text-sm text-muted-foreground">Track your fasting days</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
} 