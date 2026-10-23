"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth";

export default function InicioPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? "/dashboard" : "/login");
    }
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Logo />
      <p className="text-sm text-muted-foreground">Cargando…</p>
    </div>
  );
}
