"use client";

import { usePathname } from "next/navigation";
import { DueFab } from "@/components/due/due-fab";
import { ExpenseFab } from "@/components/expenses/expense-fab";
import { SaleFab } from "@/components/sales/sale-fab";

export function SmartFab() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard/expenses")) {
    return <ExpenseFab />;
  }

  if (pathname.startsWith("/dashboard/due")) {
    return <DueFab />;
  }

  if (pathname.startsWith("/dashboard/sales") || pathname === "/dashboard") {
    return <SaleFab />;
  }

  return null;
}
