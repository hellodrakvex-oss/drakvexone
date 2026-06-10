import type { DateFilter, Expense } from "./types";

export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function isThisWeek(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  return date >= weekStart && date <= today;
}

export function isThisMonth(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  );
}

export function filterExpenses(
  expenses: Expense[],
  searchQuery: string,
  dateFilter: DateFilter
): Expense[] {
  return expenses.filter((expense) => {
    // Date filter
    if (dateFilter === "today" && !isToday(expense.createdAt)) {
      return false;
    }
    if (dateFilter === "week" && !isThisWeek(expense.createdAt)) {
      return false;
    }
    if (dateFilter === "month" && !isThisMonth(expense.createdAt)) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        expense.category.toLowerCase().includes(query) ||
        expense.description?.toLowerCase().includes(query) ||
        expense.notes?.toLowerCase().includes(query) ||
        expense.amount.toString().includes(query)
      );
    }

    return true;
  });
}

export function sumAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function averageAmount(expenses: Expense[]): number {
  return expenses.length > 0 ? sumAmount(expenses) / expenses.length : 0;
}

export function isInFilter(expense: Expense, dateFilter: DateFilter): boolean {
  if (dateFilter === "today") return isToday(expense.createdAt);
  if (dateFilter === "week") return isThisWeek(expense.createdAt);
  if (dateFilter === "month") return isThisMonth(expense.createdAt);
  return true;
}

export function groupByCategory(
  expenses: Expense[]
): Record<string, { total: number; count: number }> {
  const grouped: Record<string, { total: number; count: number }> = {};

  expenses.forEach((expense) => {
    if (!grouped[expense.category]) {
      grouped[expense.category] = { total: 0, count: 0 };
    }
    grouped[expense.category].total += expense.amount;
    grouped[expense.category].count += 1;
  });

  return grouped;
}
