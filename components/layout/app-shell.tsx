"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { AppNav } from "@/components/layout/app-nav";
import { useAuth } from "@/lib/auth";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background">
        <Logo />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          Cargando tu tienda…
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AppNav />
      <main className="min-w-0 flex-1 pb-[calc(4.4rem+env(safe-area-inset-bottom))] pt-14 md:pb-0 md:pt-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
