"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Moon, Sunrise, BookOpen, BookText } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useNavStore } from "@/lib/store/navStore";
import { useEffect } from "react";

type NavItem = {
  name: string;
  section: 'dashboard' | 'prayer' | 'fasting' | 'quran' | 'kultum';
  href: (isLoggedIn: boolean) => string;
  icon: React.ReactNode;
  isDisabled?: boolean;
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { activeSection, setActiveSection } = useNavStore();

  // Update active section based on pathname when component mounts or pathname changes
  useEffect(() => {
    if (pathname.includes('/dashboard')) {
      setActiveSection('dashboard');
    } else if (pathname.includes('/prayer')) {
      setActiveSection('prayer');
    } else if (pathname.includes('/fasting')) {
      setActiveSection('fasting');
    } else if (pathname.includes('/quran')) {
      setActiveSection('quran');
    } else if (pathname.includes('/kultum')) {
      setActiveSection('kultum');
    }
  }, [pathname, setActiveSection]);

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      section: 'dashboard',
      href: (isLoggedIn) => isLoggedIn ? "/protected/dashboard" : "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "Prayer",
      section: 'prayer',
      href: (isLoggedIn) => isLoggedIn ? "/protected/prayer" : "/prayer",
      icon: <Moon className="h-5 w-5" />,
    },
    {
      name: "Fasting",
      section: 'fasting',
      href: (isLoggedIn) => isLoggedIn ? "/protected/fasting" : "/fasting",
      icon: <Sunrise className="h-5 w-5" />,
      isDisabled: true,
    },
    {
      name: "Quran",
      section: 'quran',
      href: (isLoggedIn) => isLoggedIn ? "/protected/quran" : "/quran",
      icon: <BookOpen className="h-5 w-5" />,
      isDisabled: true,
    },
    {
      name: "Kultum",
      section: 'kultum',
      href: (isLoggedIn) => isLoggedIn ? "/protected/kultum" : "/kultum",
      icon: <BookText className="h-5 w-5" />,
      isDisabled: true,
    },
  ];

  const handleNavigation = (item: NavItem) => {
    if (item.isDisabled) return;
    
    // Update active section immediately for instant UI feedback
    setActiveSection(item.section);
    
    // Navigate to the appropriate URL
    router.push(item.href(isLoggedIn));
  };

  return (
    <div className="fixed z-50 px-4 w-full transition-all duration-300 bottom-6 md:top-6 md:bottom-auto">
      <nav
        className={cn(
          "backdrop-blur-md bg-background/80 border border-border/50 rounded-full mx-auto max-w-md",
          "flex items-center justify-between py-2 px-4",
          "shadow-lg"
        )}
      >
        {navItems.map((item) => (
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