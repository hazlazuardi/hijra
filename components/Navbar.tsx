"use client";

import { useAuthStore } from "@/lib/store/authStore";
import { useNavStore } from "@/lib/store/navStore";
import Link from "next/link";
import { Moon, BookOpen, Home, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/prayer", icon: Moon, label: "Prayer" },
  { href: "/quran", icon: BookOpen, label: "Quran" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function Navbar() {
  const { isLoggedIn } = useAuthStore();
  const { activeSection } = useNavStore();

  if (!isLoggedIn) return null;

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="navbar-desktop">
        <div className="max-w-screen-xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold text-lg">
            Hijra
          </Link>
          <div className="flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.label.toLowerCase();
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 hover:text-primary transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="navbar-mobile">
        <div className="h-full flex items-center justify-around px-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.label.toLowerCase();
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
} 