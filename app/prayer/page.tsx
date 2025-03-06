"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicPrayerPage() {
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();
  
  // If user is logged in, redirect to protected prayer page
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/protected/prayer");
    }
  }, [isLoggedIn, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Prayer Tracking</h1>
      
      <p className="text-lg text-muted-foreground mb-6">
        Track your daily prayers to build consistency in your worship.
      </p>
      
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 w-full">
        <h2 className="text-xl font-semibold mb-3">Features</h2>
        <ul className="space-y-2 text-left">
          <li>• Track all five daily prayers</li>
          <li>• Record prayer status: on time, late, missed, or no entry</li>
          <li>• Works offline - no internet required</li>
          <li>• View your prayer history by date</li>
          <li>• Syncs across all your devices</li>
        </ul>
      </div>
      
      <div className="space-y-4 w-full max-w-xs">
        <Link href="/sign-in" className="w-full">
          <Button className="w-full">Sign In to Track Prayers</Button>
        </Link>
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-primary underline underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
