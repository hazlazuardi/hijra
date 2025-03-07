"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Moon, Sunrise, BookOpen, User } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useNavStore } from "@/lib/store/navStore";
import { useEffect, useState, useCallback } from "react";

type NavItem = {
  name: string;
  section: 'dashboard' | 'prayer' | 'fasting' | 'quran' | 'profile';
  href: string;
  icon: React.ReactNode;
  isDisabled?: boolean;
  showWhenLoggedIn?: boolean;
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, checkUser } = useAuthStore();
  const { activeSection, setActiveSection } = useNavStore();
  const [mounted, setMounted] = useState(false);

  // Check auth state once on mount and when pathname changes
  useEffect(() => {
    const loadAuthState = async () => {
      await checkUser();
      setMounted(true);
    };
    
    loadAuthState();
  }, [checkUser, pathname]);

  // Update active section based on pathname and auth state
  useEffect(() => {
    if (pathname === '/') {
      // On root path, set active section based on auth state
      setActiveSection(isLoggedIn ? 'dashboard' : 'dashboard');
    } else if (pathname.includes('/prayer')) {
      setActiveSection('prayer');
    } else if (pathname.includes('/fasting')) {
      setActiveSection('fasting');
    } else if (pathname.includes('/quran')) {
      setActiveSection('quran');
    } else if (pathname.includes('/profile')) {
      setActiveSection('profile');
    } else if (pathname.includes('/dashboard')) {
      setActiveSection('dashboard');
    }
  }, [pathname, setActiveSection, isLoggedIn]);

  // Memoized navigation handler
  const handleNavigation = useCallback((item: NavItem) => {
    if (item.isDisabled) return;
    
    // Don't navigate to protected sections if not logged in
    if (item.showWhenLoggedIn && !isLoggedIn) {
      router.push('/sign-in');
      return;
    }
    
    // Update active section immediately for instant UI feedback
    setActiveSection(item.section);
    
    // Navigate only if different from current path
    if (pathname !== item.href) {
      router.push(item.href);
    }
  }, [isLoggedIn, router, pathname, setActiveSection]);
  
  // List of navigation items - updated for simplicity
  const navItems: NavItem[] = [
    {
      name: "Home",
      section: 'dashboard',
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "Prayer",
      section: 'prayer',
      href: "/prayer",
      icon: <Moon className="h-5 w-5" />,
    },
    {
      name: "Fasting",
      section: 'fasting',
      href: "/fasting",
      icon: <Sunrise className="h-5 w-5" />,
      isDisabled: true,
    },
    {
      name: "Quran",
      section: 'quran',
      href: "/quran",
      icon: <BookOpen className="h-5 w-5" />,
      isDisabled: true,
    },
    {
      name: "Profile",
      section: 'profile',
      href: "/profile",
      icon: <User className="h-5 w-5" />,
      showWhenLoggedIn: true, // Only show when logged in
    },
  ];
  
  // Get list of items to display based on auth status
  const visibleNavItems = navItems.filter(item => 
    !item.showWhenLoggedIn || (item.showWhenLoggedIn && isLoggedIn)
  );

  // Don't render until mounted to ensure we have the correct auth state
  if (!mounted) {
    return (
      <div className="fixed z-50 px-4 w-full transition-all duration-300 bottom-6">
        <nav
          className={cn(
            "backdrop-blur-md bg-background/80 border border-border/50 rounded-full mx-auto max-w-md",
            "flex items-center justify-between py-2 px-4",
            "shadow-lg"
          )}
        >
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-12 h-12 rounded-full bg-background/50 animate-pulse"></div>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="fixed z-50 px-4 w-full transition-all duration-300 bottom-6 md:top-6 md:bottom-auto">
      <nav
        className={cn(
          "backdrop-blur-md bg-background/80 border border-border/50 rounded-full mx-auto max-w-md",
          "flex items-center justify-between py-2 px-4",
          "shadow-lg"
        )}
      >
        {visibleNavItems.map((item) => (
          <NavButton
            key={item.name}
            item={item}
            isActive={activeSection === item.section}
            onClick={() => handleNavigation(item)}
            showOnMd={true}
          />
        ))}
      </nav>
    </div>
  );
}

type NavButtonProps = {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  showLabels?: boolean;
  showOnMd?: boolean;
};

function NavButton({
  item,
  isActive,
  onClick,
  showLabels = false,
  showOnMd = false,
}: NavButtonProps) {
  const activeClass = "bg-primary text-primary-foreground";
  const hoverClass = "hover:bg-secondary/80";
  const disabledClass = "opacity-50 cursor-not-allowed";

  return (
    <button
      onClick={onClick}
      disabled={item.isDisabled}
      className={cn(
        "flex items-center justify-center rounded-full p-2 transition-all",
        showLabels ? "px-4 gap-2" : "w-12 h-12",
        showOnMd && "md:px-4 md:gap-2",
        isActive ? activeClass : hoverClass,
        item.isDisabled && disabledClass
      )}
      aria-disabled={item.isDisabled}
    >
      {item.icon}
      {showLabels && <span className="font-medium">{item.name}</span>}
      {showOnMd && <span className="hidden md:inline font-medium">{item.name}</span>}
    </button>
  );
} 