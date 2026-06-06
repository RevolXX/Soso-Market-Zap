"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scan, ChartBar, Gear } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { href: "/", label: "Home", icon: ChartBar },
  { href: "/signals", label: "Signals", icon: Scan },
  { href: "/agent", label: "Agent", icon: Gear },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/60">
      <div className="hidden border-b border-border/40 bg-card/30 px-4 py-1 text-[10px] font-mono text-muted-foreground sm:flex sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-primary text-[9px] tracking-[0.3em] uppercase">
            SoSoValue Buildathon
          </span>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2">
        <Link href="/" prefetch={true} className="flex items-center gap-2">
          <span className="font-heading text-lg font-bold tracking-tight">
            Soso<span className="text-primary">MarketZap</span>
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-0.5 rounded-lg border border-border/60 bg-card/50 px-1 py-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground font-mono text-xs tracking-wider transition-colors hover:text-foreground hover:bg-accent/50",
                  isActive && "bg-primary/10 text-primary border border-primary/20",
                )}
              >
                <item.icon className="h-3.5 w-3.5" weight={isActive ? "fill" : "regular"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={cn(
                  "inline-flex items-center gap-1 rounded px-2 py-1.5 text-muted-foreground font-mono text-xs tracking-wider",
                  isActive && "bg-primary/10 text-primary border border-primary/20",
                )}
              >
                <item.icon className="h-3.5 w-3.5" weight={isActive ? "fill" : "regular"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
