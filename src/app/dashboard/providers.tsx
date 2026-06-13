"use client";

import { useEffect } from "react";
import { SmartFab } from "@/components/dashboard/smart-fab";
import { AddDueDrawer } from "@/components/due/add-due-drawer";
import { AddExpenseDrawer } from "@/components/expenses/add-expense-drawer";
import { AddSaleDrawer } from "@/components/sales/add-sale-drawer";
import { ThemeApplier } from "@/components/settings/theme-applier";
import { DueProvider } from "@/contexts/due-context";
import { ExpensesProvider } from "@/contexts/expenses-context";
import { SalesProvider } from "@/contexts/sales-context";
import { SettingsProvider } from "@/contexts/settings-context";
import { QuickAddProvider } from "@/contexts/quick-add-context";
import { NotificationsProvider } from "@/contexts/notifications-context";
import { useAuth } from "@/contexts/auth-context";
import * as authFns from "@/lib/supabase/auth";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const NotificationDrawer = dynamic(() => import("@/components/notifications/notification-drawer").then(mod => mod.NotificationDrawer), { ssr: false });

function DashboardInitializer({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  // Verify user setup on dashboard load
  useEffect(() => {
    // Prefetch core routes in the background
    router.prefetch('/dashboard');
    router.prefetch('/dashboard/sales');
    router.prefetch('/dashboard/expenses');
    router.prefetch('/dashboard/due');
    router.prefetch('/dashboard/customers');
    router.prefetch('/dashboard/settings');
    router.prefetch('/dashboard/reports');
    if (user?.id) {
// console.log(`[Dashboard] Verifying setup for user: ${user.id}`);
      authFns.ensureUserSetup(user.id).catch((error) => {
        console.error('[Dashboard] Setup verification failed:', error);
        // Don't block dashboard - just log the error
      });
    }
  }, [user?.id]);

  return <>{children}</>;
}

import { SearchProvider } from "@/contexts/search-context";

const GlobalSearchScreen = dynamic(() => import("@/components/search/global-search-screen").then(mod => mod.GlobalSearchScreen), { ssr: false });

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <NotificationsProvider>
        <ThemeApplier />
        <SearchProvider>
          <SalesProvider>
            <QuickAddProvider>
              <DueProvider>
                <ExpensesProvider>
                  <DashboardInitializer>
                    {children}
                    <AddSaleDrawer />
                    <AddDueDrawer />
                    <AddExpenseDrawer />
                    <SmartFab />
                    <NotificationDrawer />
                    <GlobalSearchScreen />
                  </DashboardInitializer>
                </ExpensesProvider>
              </DueProvider>
            </QuickAddProvider>
          </SalesProvider>
        </SearchProvider>
      </NotificationsProvider>
    </SettingsProvider>
  );
}
