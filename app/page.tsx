import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 max-w-3xl mx-auto text-center px-4">
      <h1 className="text-5xl font-bold tracking-tight">Welcome to Hijra</h1>
      <p className="text-xl text-muted-foreground">
        Your personal companion for Islamic practices and spiritual growth
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-8">
        <div className="bg-card border rounded-lg p-6 flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-3">Prayer Tracking</h3>
          <p className="text-muted-foreground mb-4">
            Track your daily prayers and build consistency in your worship
          </p>
          <Link href="/prayer" className="mt-auto">
            <Button variant="outline" className="w-full">Explore Prayer</Button>
          </Link>
        </div>
        
        <div className="bg-card border rounded-lg p-6 flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-3">Quran Reading</h3>
          <p className="text-muted-foreground mb-4">
            Access the Quran with translations and track your reading progress
          </p>
          <Link href="/quran" className="mt-auto">
            <Button variant="outline" className="w-full">Explore Quran</Button>
          </Link>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Link href="/sign-in">
          <Button size="lg">Sign In</Button>
        </Link>
        <Link href="/sign-up">
          <Button variant="outline" size="lg">Create Account</Button>
        </Link>
      </div>
    </div>
  );
}
