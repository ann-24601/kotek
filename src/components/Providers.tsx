"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { CatProvider } from "@/context/CatContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CatProvider>{children}</CatProvider>
    </AuthProvider>
  );
}
