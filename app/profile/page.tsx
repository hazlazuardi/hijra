"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useNavStore } from "@/lib/store/navStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, Moon, BookOpen } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoggedIn, signOut, checkUser } = useAuthStore();
  const { setActiveSection } = useNavStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const userData = await checkUser();
      setMounted(true);
      
      if (!userData) {
        router.replace('/sign-in');
      }
    };
    
    checkAuth();
  }, [checkUser, router]);

  // Update active section for navbar
  useEffect(() => {
    setActiveSection('profile');
  }, [setActiveSection]);

  // Handle sign out
  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut();
    router.push('/');
    setIsLoading(false);
  };

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

  return (
    <div className="flex flex-col items-center justify-start max-w-md mx-auto px-4 pb-20">
      <div className="w-full mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings
        </p>
      </div>

      <div className="w-full flex items-center p-4 bg-card border rounded-lg mb-6">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mr-4">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">{user?.email || 'User'}</h2>
          <p className="text-sm text-muted-foreground">{user?.id}</p>
        </div>
      </div>

      <div className="w-full space-y-4">
        <h3 className="font-medium text-lg">Account</h3>
        
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start text-left flex items-center gap-3" 
            onClick={handleSignOut}
            disabled={isLoading}
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <span className="flex-1">Sign Out</span>
            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>}
          </Button>
          
          <Button variant="outline" className="w-full justify-start text-left flex items-center gap-3">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1">Settings</span>
          </Button>
        </div>
        
        <h3 className="font-medium text-lg mt-6">App Features</h3>
        
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start text-left flex items-center gap-3"
            onClick={() => router.push('/prayer')}
          >
            <Moon className="w-5 h-5 text-indigo-500" />
            <span className="flex-1">Prayer Tracking</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-left flex items-center gap-3"
            onClick={() => router.push('/quran')}
          >
            <BookOpen className="w-5 h-5 text-emerald-500" />
            <span className="flex-1">Quran Reading</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 