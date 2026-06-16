"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { CatProvider } from "@/context/CatContext";
import { AgentsProvider } from "@/context/AgentsContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AgentsProvider>
        <CatProvider>{children}</CatProvider>
      </AgentsProvider>
    </AuthProvider>
  );
}
