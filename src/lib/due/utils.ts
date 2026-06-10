import type { CustomerDue, StatusFilter } from "./types";

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isToday(iso: string) {
  return startOfDay(new Date(iso)).getTime() === startOfDay(new Date()).getTime();
}

export function filterDues(
  dues: CustomerDue[],
  opts: { query?: string; statusFilter?: StatusFilter }
) {
  const q = opts.query?.trim().toLowerCase() ?? "";
  return dues
    .filter((d) => {
      if (opts.statusFilter === "pending") return d.status === "pending";
      if (opts.statusFilter === "paid") return d.status === "paid";
      return true;
    })
    .filter((d) => {
      if (!q) return true;
      const name = d.customerName.toLowerCase();
      const phone = d.phone?.toLowerCase() ?? "";
      const notes = d.notes?.toLowerCase() ?? "";
      const amount = String(d.amount);
      return name.includes(q) || phone.includes(q) || notes.includes(q) || amount.includes(q);
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function sumPending(dues: CustomerDue[]) {
  return dues
    .filter((d) => d.status === "pending")
    .reduce((acc, d) => acc + (d.amount - (d.paidAmount || 0)), 0);
}

export function countPending(dues: CustomerDue[]) {
  return dues.filter((d) => d.status === "pending").length;
}

export function sumCollectedToday(dues: CustomerDue[]) {
  return dues
    .filter((d) => d.status === "paid" && d.paidAt && isToday(d.paidAt))
    .reduce((acc, d) => acc + d.amount, 0);
}

export function formatCurrency(amount: number) {
  return amount.toLocaleString("en-IN");
}

export function formatDueDate(iso: string) {
  const d = new Date(iso);
  const today = startOfDay(new Date());
  const due = startOfDay(d);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays === -1) return "Due yesterday";
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;

  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatUpdatedTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function toDateInputValue(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dateInputToIso(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
  return dt.toISOString();
}

export function defaultDueDateInput() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return toDateInputValue(d.toISOString());
}
