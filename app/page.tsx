'use client';

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useNavStore } from "@/lib/store/navStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Moon, BookOpen, Sunrise, CheckCircle, Star, Users, Clock, Shield, Smartphone } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const { user, isLoggedIn, checkUser } = useAuthStore();
  const { setActiveSection } = useNavStore();
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
    if (isLoggedIn) {
      setActiveSection('dashboard');
    }
  }, [isLoggedIn, setActiveSection]);

  // Show loading state if not mounted yet
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // For authenticated users, redirect to dashboard
  if (isLoggedIn) {
    window.location.href = '/dashboard';
    return null;
  }

  // For non-authenticated users, show the high-converting landing page
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
          <div className="flex flex-col items-center text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Strengthen Your Faith Journey
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-8">
              Track your prayers, read Quran, and build consistent spiritual habits with Hijra - your personal Islamic companion app.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/sign-up">
                <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  Sign In
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>No credit card required • Free account • Works offline</span>
            </div>
          </div>
          
          {/* App Preview */}
          <div className="relative w-full max-w-3xl h-[400px] rounded-xl overflow-hidden shadow-2xl border border-primary/20 bg-card">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Moon className="h-16 w-16 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">App Preview</p>
                <p className="text-sm text-muted-foreground">Track your prayers with beautiful UI</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Social Proof */}
      <section className="w-full py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Trusted by Muslims Worldwide</h2>
            <p className="text-muted-foreground">Join thousands of Muslims who use Hijra to strengthen their faith</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="ml-2 font-medium">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">10,000+ Active Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-medium">1M+ Prayers Tracked</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <Card className="p-6 bg-card border">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-sm mb-4 flex-grow">
                  "Hijra has transformed my prayer routine. The tracking feature helps me stay accountable and consistent with my daily prayers."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-medium text-primary">A</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Ahmed S.</p>
                    <p className="text-xs text-muted-foreground">Using Hijra for 6 months</p>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Testimonial 2 */}
            <Card className="p-6 bg-card border">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-sm mb-4 flex-grow">
                  "I love that I can track my prayers even when I'm offline. The app syncs perfectly when I'm back online. It's been a game-changer for my spiritual journey."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-medium text-primary">F</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Fatima R.</p>
                    <p className="text-xs text-muted-foreground">Using Hijra for 1 year</p>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Testimonial 3 */}
            <Card className="p-6 bg-card border">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-sm mb-4 flex-grow">
                  "The Quran reading tracker helps me stay consistent with my daily readings. I can easily pick up where I left off and track my progress."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-medium text-primary">Y</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Yusuf M.</p>
                    <p className="text-xs text-muted-foreground">Using Hijra for 3 months</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="w-full py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need for Your Spiritual Journey</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Hijra provides powerful tools to help you stay consistent with your Islamic practices
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Moon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Prayer Tracking</h3>
              <p className="text-muted-foreground mb-4">
                Track all five daily prayers with detailed status: on time, late, missed, or not recorded.
              </p>
              <Link href="/prayer" className="text-primary hover:underline mt-auto">
                Learn more →
              </Link>
            </div>
            
            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quran Reading</h3>
              <p className="text-muted-foreground mb-4">
                Access the Quran with translations and track your reading progress across devices.
              </p>
              <Link href="/quran" className="text-primary hover:underline mt-auto">
                Learn more →
              </Link>
            </div>
            
            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Works Offline</h3>
              <p className="text-muted-foreground mb-4">
                Use Hijra without internet connection. Your data syncs automatically when you're back online.
              </p>
              <span className="text-primary mt-auto">
                Available now
              </span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="w-full py-16 bg-primary/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Hijra?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Designed to help you build and maintain consistent Islamic practices
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Benefit 1 */}
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Build Consistency</h3>
                <p className="text-muted-foreground">
                  Track your prayers and Quran reading to build consistent habits that strengthen your faith.
                </p>
              </div>
            </div>
            
            {/* Benefit 2 */}
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Stay Accountable</h3>
                <p className="text-muted-foreground">
                  Visual tracking helps you stay accountable to your spiritual goals and see your progress.
                </p>
              </div>
            </div>
            
            {/* Benefit 3 */}
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Access Anywhere</h3>
                <p className="text-muted-foreground">
                  Use Hijra on any device, with or without internet. Your data syncs across all your devices.
                </p>
              </div>
            </div>
            
            {/* Benefit 4 */}
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Privacy Focused</h3>
                <p className="text-muted-foreground">
                  Your spiritual journey is personal. We respect your privacy and secure your data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="w-full py-16 bg-primary/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Your Spiritual Journey Today</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of Muslims who use Hijra to strengthen their faith and build consistent spiritual habits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                Create Free Account
              </Button>
            </Link>
            <Link href="/prayer">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Explore Features
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required • Free account • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
