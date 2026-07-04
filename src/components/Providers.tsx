"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { CatProvider } from "@/context/CatContext";
import { AgentsProvider } from "@/context/AgentsContext";
import { PostHogProvider } from "@/components/PostHogProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <AuthProvider>
        <AgentsProvider>
          <CatProvider>{children}</CatProvider>
        </AgentsProvider>
      </AuthProvider>
    </PostHogProvider>
  );
}
