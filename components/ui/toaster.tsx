"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      closeButton
      richColors
      expand={false}
      toastOptions={{
        style: {
          borderRadius: "14px",
          border: "1px solid #e7dccb",
          background: "#fffdf8",
          color: "#241c14",
          fontFamily: "var(--font-geist-sans)",
          boxShadow: "0 12px 40px -18px rgba(36,28,20,0.35)",
        },
      }}
    />
  );
}
