"use client";

import type { ReactNode } from "react";
import { CatProvider } from "@/context/CatContext";

export function Providers({ children }: { children: ReactNode }) {
  return <CatProvider>{children}</CatProvider>;
}
