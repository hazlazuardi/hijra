"use client";

import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useAuthStore } from "@/lib/store/authStore";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";

export function ClientHeaderAuth() {
  const { user, isLoggedIn, signOut } = useAuthStore();

  if (!hasEnvVars) {
    return (
      <>
        <div className="flex gap-4 items-center">
          <div>
            <Badge
              variant={"default"}
              className="font-normal pointer-events-none"
            >
              Please update .env.local file with anon key and url
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant={"outline"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={"default"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }
  
  return isLoggedIn ? (
    <div className="flex items-center gap-4">
      Hey, {user?.email}!
      <Button onClick={signOut} variant={"outline"}>
        Sign out
      </Button>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
} 