"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingDown, Receipt, Settings, Users, FileBarChart, Contact } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { springs } from "@/lib/motion";

export function BottomNav({ basePath = "/dashboard" }: { basePath?: string }) {
  const NAV_ITEMS = [
    { name: "Home", href: basePath, icon: LayoutDashboard },
    { name: "Sales", href: `${basePath}/sales`, icon: Receipt },
    { name: "Expenses", href: `${basePath}/expenses`, icon: TrendingDown },
    { name: "Due", href: basePath === "/demo" ? `${basePath}/dues` : `${basePath}/due`, icon: Users },
    { name: "Customers", href: `${basePath}/customers`, icon: Contact },
    { name: "Reports", href: `${basePath}/reports`, icon: FileBarChart },
    { name: "More", href: `${basePath}/settings`, icon: Settings },
  ];
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-3 pb-safe pointer-events-none">
      <nav
        className={cn(
          "flex items-center p-1.5 rounded-full glass-panel-heavy pointer-events-auto max-w-full",
          "border border-border/50 dark:border-white/12",
          "shadow-[0_8px_40px_-8px_oklch(0_0_0/0.7),0_0_60px_-16px_rgb(var(--glow-primary)/0.25)]"
        )}
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === basePath
              ? pathname === basePath
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                if (pathname === item.href) {
                  e.preventDefault();
                }
              }}
              className={cn(
                "relative flex flex-col items-center justify-center w-[50px] sm:w-[56px] h-[52px] transition-colors duration-300 z-10",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-[18px] h-[18px] mb-1 transition-transform duration-300",
                  isActive && "drop-shadow-[0_0_8px_rgb(var(--glow-primary)/0.6)]"
                )}
              />
              <span className="text-[9px] font-medium tracking-wide text-center leading-none">{item.name}</span>

              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-[0_0_20px_rgb(var(--glow-primary)/0.5)]"
                  transition={springs.navPill}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
