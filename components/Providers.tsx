"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth-provider";
import OfflineStatus from "@/components/offline-status";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import ServiceWorkerRegister from "@/components/sw-register-script";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <OfflineStatus />
        {children}
        <PWAInstallPrompt />
        <ServiceWorkerRegister />
      </AuthProvider>
    </ThemeProvider>
  );
} 