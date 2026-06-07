"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { useCat } from "@/context/CatContext";
import { useAuth } from "@/context/AuthContext";
import { Onboarding } from "@/screens/Onboarding";
import { Auth } from "@/screens/Auth";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const NAV: NavItem[] = [
  { href: "/", label: "Dziś", icon: "today" },
  { href: "/behawiorysta", label: "Behawiorysta", icon: "chat" },
  { href: "/statystyki", label: "Statystyki", icon: "stats" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex" aria-hidden="true">
        <Icon name="cat" size={36} />
      </span>
      <span className="font-hand text-[1.6rem] font-bold tracking-wide">Kotek</span>
    </div>
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  const { loaded, profile } = useCat();
  const { loading: authLoading, session } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (authLoading) {
    return (
      <div className="grid h-[100dvh] place-items-center text-ink-faint">Wczytuję…</div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (!loaded) {
    return (
      <div className="grid h-[100dvh] place-items-center text-ink-faint">Wczytuję…</div>
    );
  }

  if (!profile) {
    return <Onboarding />;
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Sidebar — desktop */}
      <aside
        className="hidden h-full w-[248px] shrink-0 flex-col overflow-y-auto border-r-2 border-ink px-4 py-6 lg:flex"
        aria-label="Nawigacja główna"
      >
        <Logo />
        <nav className="mt-8 flex flex-col gap-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-[var(--r-chip)] border-2 border-transparent px-3.5 py-[11px] font-hand text-[1.1875rem] font-semibold text-ink no-underline hover:border-hairline",
                isActive(pathname, item.href) && "border-ink bg-ink text-paper hover:border-ink",
              )}
            >
              <Icon name={item.icon} size={25} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <Link
          href="/ustawienia"
          className={cn(
            "mt-auto flex min-h-11 items-center gap-3 rounded-[var(--r-chip)] border-2 border-transparent px-3.5 py-[11px] font-hand text-[1.1875rem] font-semibold text-ink no-underline hover:border-hairline",
            isActive(pathname, "/ustawienia") && "border-ink bg-ink text-paper hover:border-ink",
          )}
        >
          <Icon name="settings" size={25} />
          <span>Ustawienia</span>
        </Link>
      </aside>

      {/* Treść */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b-2 border-ink px-4 py-3 lg:hidden">
          <div>
            <Logo />
          </div>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--r-box)] border-2 border-ink bg-paper text-ink active:translate-x-[1px] active:translate-y-[1px]"
            onClick={() => router.push("/ustawienia")}
            aria-label="Ustawienia"
          >
            <Icon name="settings" size={24} />
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto" id="tresc">
          <div className="mx-auto max-w-[720px] px-4 py-4 pb-8 lg:px-6 lg:py-8">
            {children}
          </div>
        </main>

        {/* Dolna nawigacja — mobile */}
        <nav
          className="flex shrink-0 border-t-2 border-ink px-1 pb-[calc(6px+env(safe-area-inset-bottom,0px))] pt-1.5 lg:hidden"
          aria-label="Nawigacja główna"
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-11 flex-1 flex-col items-center gap-[3px] py-1.5 no-underline",
                  active ? "text-ink" : "text-ink-faint",
                )}
              >
                <Icon name={item.icon} size={26} />
                <span
                  className={cn(
                    "font-hand text-xs font-semibold",
                    active && "underline decoration-2 underline-offset-[3px]",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
