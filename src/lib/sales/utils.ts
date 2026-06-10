import type { DateFilter, Sale } from "./types";

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}

export function startOfMonth(d: Date) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

export function isInFilter(sale: Sale, filter: DateFilter, now = new Date()) {
  const created = new Date(sale.createdAt);
  if (filter === "all") return true;
  if (filter === "today") return created >= startOfDay(now);
  if (filter === "week") return created >= startOfWeek(now);
  if (filter === "month") return created >= startOfMonth(now);
  return true;
}

export function filterSales(
  sales: Sale[],
  opts: { query?: string; dateFilter?: DateFilter }
) {
  const q = opts.query?.trim().toLowerCase() ?? "";
  return sales
    .filter((s) => (opts.dateFilter ? isInFilter(s, opts.dateFilter) : true))
    .filter((s) => {
      if (!q) return true;
      const item = s.itemName?.toLowerCase() ?? "";
      const notes = s.notes?.toLowerCase() ?? "";
      const amount = String(s.amount);
      const method = s.paymentMethod;
      return item.includes(q) || notes.includes(q) || amount.includes(q) || method.includes(q);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function sumAmount(sales: Sale[]) {
  return sales.reduce((acc, s) => acc + s.amount, 0);
}

export function averageAmount(sales: Sale[]) {
  if (sales.length === 0) return 0;
  return Math.round(sumAmount(sales) / sales.length);
}

export function formatSaleTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = startOfDay(d).getTime() === startOfDay(now).getTime();

  if (isToday) {
    return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatCurrency(amount: number) {
  return amount.toLocaleString("en-IN");
}
