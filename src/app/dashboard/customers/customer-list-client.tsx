"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Users, AlertTriangle } from "lucide-react";
import type { CustomerSummary } from "@/lib/customers/types";

type FilterType = "All" | "Trusted" | "Regular" | "Risk";

export function CustomerListClient({ customers, defaultSearch = "" }: { customers: CustomerSummary[], defaultSearch?: string }) {
  const [search, setSearch] = useState(defaultSearch);
  const [filter, setFilter] = useState<FilterType>("All");
  const router = useRouter();
  const pathname = usePathname();

  // Debounce search update
  useEffect(() => {
    if (search === defaultSearch) return;

    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      router.replace(`${pathname}?${params.toString()}`);
    }, 400); // 400ms debounce

    return () => clearTimeout(timeoutId);
  }, [search, pathname, router, defaultSearch]);

  const phoneCounts = useMemo(() => {
    const counts = new Map<string, number>();
    customers.forEach((c) => {
      if (c.phone) {
        counts.set(c.phone, (counts.get(c.phone) || 0) + 1);
      }
    });
    return counts;
  }, [customers]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      // 1. Filter by Segment
      if (filter !== "All" && c.segment !== filter) return false;
      return true;
    });
  }, [customers, filter]);

  if (customers.length === 0 && !search) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No customers yet</h3>
        <p className="text-muted-foreground mb-6">
          When you add sales or dues with a customer name, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search customer name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Filter Chips & Count */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["All", "Trusted", "Regular", "Risk"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                filter === f
                  ? "bg-primary/20 text-primary border-primary/50"
                  : "bg-white/5 text-muted-foreground border-white/10 hover:text-foreground hover:bg-white/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground font-medium px-1">
          {filtered.length} Customer{filtered.length !== 1 && "s"}
        </p>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">No customers found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 mt-1">
          {filtered.map((customer) => {
            const isDuplicate = customer.phone && phoneCounts.get(customer.phone)! > 1;

            return (
              <Link key={customer.id} href={`/dashboard/customers/${customer.id}`}>
                <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3 hover:bg-white/10 transition-colors active:scale-[0.98]">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base truncate">{customer.customerName}</h3>
                      {customer.phone && (
                        <p className="text-xs text-muted-foreground mt-0.5">{customer.phone}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${
                        customer.segment === "Trusted" ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" :
                        customer.segment === "Risk" ? "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30" :
                        "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30"
                      }`}>
                        {customer.segment}
                      </span>
                      {isDuplicate && (
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full ring-1 ring-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          Duplicate
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-1 bg-black/20 p-3 rounded-xl border border-white/5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Purchases</p>
                      <p className="font-semibold text-foreground text-sm">₹{(customer.totalSales || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Current Due</p>
                      <p className={`font-semibold text-sm ${customer.totalDue > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        ₹{(customer.totalDue || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-[10px] text-muted-foreground/80 font-medium px-1">
                    <span>{customer.transactionCount} transactions</span>
                    <span>Last active: {customer.lastActivity ? new Date(customer.lastActivity).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }) : "N/A"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
