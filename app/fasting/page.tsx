'use client';

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useNavStore } from "@/lib/store/navStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sunrise } from "lucide-react";

export default function FastingPage() {
  const { user, isLoggedIn, checkUser } = useAuthStore();
  const { setActiveSection } = useNavStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      await checkUser();
      setMounted(true);
    };
    
    checkAuth();
  }, [checkUser]);

  // Update active section for navbar
  useEffect(() => {
    setActiveSection('fasting');
  }, [setActiveSection]);

  // Show loading state if not mounted yet
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // For authenticated users, show the Fasting tracking interface
  if (isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-start max-w-md mx-auto w-full px-4">
        <h1 className="text-3xl font-bold mb-2">Fasting Tracker</h1>
        <p className="text-muted-foreground text-center mb-8">
          Track your fasting days and build consistency
        </p>
        
        <div className="w-full p-4 border rounded-lg bg-amber-50 dark:bg-amber-900/20 text-center mb-8">
          <p className="text-amber-700 dark:text-amber-400 font-medium">
            This feature is currently in development.<br/>
            Coming soon, inshaAllah.
          </p>
        </div>
        
        <div className="w-full space-y-4">
          <h2 className="text-xl font-semibold">Planned Features</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Sunrise className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Track Fasting Days</h3>
                  <p className="text-sm text-muted-foreground">Record your fasting days and intentions</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Sunrise className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Ramadan Tracker</h3>
                  <p className="text-sm text-muted-foreground">Special features for Ramadan</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Sunrise className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Fasting Reminders</h3>
                  <p className="text-sm text-muted-foreground">Set reminders for Sunnah fasting days</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // For non-authenticated users, show the public page
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center px-4">
      <h1 className="text-4xl font-bold mb-4">Fasting Tracker</h1>
      
      <p className="text-lg text-muted-foreground mb-6">
        Track your fasting days including Ramadan and Sunnah fasts.
      </p>
      
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 w-full">
        <h2 className="text-xl font-semibold mb-3">Features Coming Soon</h2>
        <ul className="space-y-2 text-left">
          <li>• Track your fasting days</li>
          <li>• Special tracker for Ramadan</li>
          <li>• Reminders for Sunnah fasting days</li>
          <li>• Add notes for each fasting day</li>
          <li>• Works offline - no internet required</li>
        </ul>
      </div>
      
      <div className="space-y-4 w-full max-w-xs">
        <Link href="/sign-in" className="w-full">
          <Button className="w-full">Sign In</Button>
        </Link>
        <Link href="/sign-up" className="w-full">
          <Button variant="outline" className="w-full">Create Account</Button>
        </Link>
      </div>
    </div>
  );
} 