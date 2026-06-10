export type ExpenseCategory =
  | "inventory"
  | "supplier"
  | "rent"
  | "electricity"
  | "salary"
  | "transport"
  | "other";

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  notes?: string;
  createdAt: string;
}

export interface NewExpenseInput {
  amount: number;
  category: ExpenseCategory;
  description?: string;
  notes?: string;
}

export type DateFilter = "today" | "week" | "month" | "all";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: "inventory", label: "Inventory", icon: "📦" },
  { value: "supplier", label: "Supplier", icon: "🚚" },
  { value: "rent", label: "Rent", icon: "🏪" },
  { value: "electricity", label: "Electricity", icon: "⚡" },
  { value: "salary", label: "Salary", icon: "👥" },
  { value: "transport", label: "Transport", icon: "🛵" },
  { value: "other", label: "Other", icon: "🔖" },
];
