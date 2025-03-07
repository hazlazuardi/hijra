import { WifiOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="mb-6 p-6 bg-amber-100 dark:bg-amber-900/30 rounded-full">
        <WifiOff size={48} className="text-amber-600 dark:text-amber-400" />
      </div>
      
      <h1 className="text-3xl font-bold mb-4">You're Offline</h1>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        The page you're trying to access isn't available offline. You can still use the pages you've visited before.
      </p>
      
      <div className="space-y-3">
        <p className="text-sm font-medium mb-2">Try one of these pages that might be cached:</p>
        
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" size="sm">Home</Button>
          </Link>
          <Link href="/prayer">
            <Button variant="outline" size="sm">Prayer Tracking</Button>
          </Link>
          <Link href="/quran">
            <Button variant="outline" size="sm">Quran</Button>
          </Link>
          <Link href="/fasting">
            <Button variant="outline" size="sm">Fasting</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 