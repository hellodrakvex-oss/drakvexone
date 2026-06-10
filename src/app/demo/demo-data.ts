// ---------------------------------------------------------------------------
// Demo / Marketing Screenshot Data
// All data is self-contained — no Supabase, no auth, no production imports.
// ---------------------------------------------------------------------------

/* ── helpers ─────────────────────────────────────────────────────────────── */

/** Returns an ISO string for today at the given hour (24-h) and minute. */
const todayAt = (hour: number, minute = 0): string => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

/** Returns an ISO date-only string offset by `days` from today (negative = past). */
const offsetDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

/* ── 1. Shop name ────────────────────────────────────────────────────────── */

export const DEMO_SHOP_NAME = "Sharma Tea House";

/* ── 2. Weekly sales ─────────────────────────────────────────────────────── */

export const DEMO_WEEKLY_SALES = [
  { day: "Mon", sales: 2400 },
  { day: "Tue", sales: 3100 },
  { day: "Wed", sales: 1800 },
  { day: "Thu", sales: 4200 },
  { day: "Fri", sales: 3800 },
  { day: "Sat", sales: 5100 },
  { day: "Sun", sales: 4600 },
] as const;

/* ── 3. Sales (today) ────────────────────────────────────────────────────── */

export type DemoSale = {
  id: string;
  amount: number;
  itemName: string;
  paymentMethod: "cash" | "upi" | "card";
  notes?: string;
  createdAt: string;
};

export const DEMO_SALES: DemoSale[] = [
  {
    id: "a1b2c3d4-0001-4aaa-b000-000000000001",
    amount: 400,
    itemName: "Masala Chai x20",
    paymentMethod: "cash",
    createdAt: todayAt(7, 15),
  },
  {
    id: "a1b2c3d4-0002-4aaa-b000-000000000002",
    amount: 160,
    itemName: "Cutting Chai x16",
    paymentMethod: "upi",
    notes: "Morning rush regulars",
    createdAt: todayAt(7, 45),
  },
  {
    id: "a1b2c3d4-0003-4aaa-b000-000000000003",
    amount: 240,
    itemName: "Samosa Plate x8",
    paymentMethod: "cash",
    createdAt: todayAt(8, 30),
  },
  {
    id: "a1b2c3d4-0004-4aaa-b000-000000000004",
    amount: 750,
    itemName: "Special Tea x15",
    paymentMethod: "upi",
    notes: "Office order – Mehta & Co.",
    createdAt: todayAt(9, 10),
  },
  {
    id: "a1b2c3d4-0005-4aaa-b000-000000000005",
    amount: 600,
    itemName: "Masala Chai x30",
    paymentMethod: "cash",
    createdAt: todayAt(10, 0),
  },
  {
    id: "a1b2c3d4-0006-4aaa-b000-000000000006",
    amount: 80,
    itemName: "Lemon Tea x4",
    paymentMethod: "card",
    createdAt: todayAt(10, 45),
  },
  {
    id: "a1b2c3d4-0007-4aaa-b000-000000000007",
    amount: 320,
    itemName: "Bread Pakora x10",
    paymentMethod: "cash",
    createdAt: todayAt(11, 30),
  },
  {
    id: "a1b2c3d4-0008-4aaa-b000-000000000008",
    amount: 2500,
    itemName: "Bulk Chai Party Order",
    paymentMethod: "upi",
    notes: "Wedding function nearby",
    createdAt: todayAt(12, 15),
  },
  {
    id: "a1b2c3d4-0009-4aaa-b000-000000000009",
    amount: 450,
    itemName: "Special Tea x10",
    paymentMethod: "upi",
    createdAt: todayAt(13, 30),
  },
  {
    id: "a1b2c3d4-0010-4aaa-b000-000000000010",
    amount: 180,
    itemName: "Cutting Chai x18",
    paymentMethod: "cash",
    notes: "Auto-stand group",
    createdAt: todayAt(14, 45),
  },
  {
    id: "a1b2c3d4-0011-4aaa-b000-000000000011",
    amount: 350,
    itemName: "Vada Pav x14",
    paymentMethod: "cash",
    createdAt: todayAt(16, 0),
  },
  {
    id: "a1b2c3d4-0012-4aaa-b000-000000000012",
    amount: 1200,
    itemName: "Masala Chai x60",
    paymentMethod: "upi",
    notes: "Evening office dispatch",
    createdAt: todayAt(17, 15),
  },
];

/* ── 4. Expenses (today) ─────────────────────────────────────────────────── */

export type DemoExpense = {
  id: string;
  amount: number;
  description: string;
  category: string;
  payment_method: "cash" | "upi" | "card";
  created_at: string;
};

export const DEMO_EXPENSES: DemoExpense[] = [
  {
    id: "e1e2e3e4-0001-4bbb-a000-000000000001",
    amount: 1500,
    description: "Tea leaves – Assam CTC 5 kg",
    category: "Supplies",
    payment_method: "cash",
    created_at: todayAt(6, 30),
  },
  {
    id: "e1e2e3e4-0002-4bbb-a000-000000000002",
    amount: 350,
    description: "Milk – 20 litres",
    category: "Supplies",
    payment_method: "cash",
    created_at: todayAt(6, 45),
  },
  {
    id: "e1e2e3e4-0003-4bbb-a000-000000000003",
    amount: 8000,
    description: "Monthly rent – June",
    category: "Rent",
    payment_method: "upi",
    created_at: todayAt(9, 0),
  },
  {
    id: "e1e2e3e4-0004-4bbb-a000-000000000004",
    amount: 1200,
    description: "Electricity bill",
    category: "Utilities",
    payment_method: "upi",
    created_at: todayAt(10, 0),
  },
  {
    id: "e1e2e3e4-0005-4bbb-a000-000000000005",
    amount: 6000,
    description: "Helper salary – Ramu",
    category: "Staff",
    payment_method: "cash",
    created_at: todayAt(11, 0),
  },
  {
    id: "e1e2e3e4-0006-4bbb-a000-000000000006",
    amount: 450,
    description: "Gas cylinder refill",
    category: "Utilities",
    payment_method: "cash",
    created_at: todayAt(12, 0),
  },
  {
    id: "e1e2e3e4-0007-4bbb-a000-000000000007",
    amount: 200,
    description: "Paper cups & napkins",
    category: "Supplies",
    payment_method: "cash",
    created_at: todayAt(13, 30),
  },
  {
    id: "e1e2e3e4-0008-4bbb-a000-000000000008",
    amount: 150,
    description: "Cleaning supplies",
    category: "Supplies",
    payment_method: "cash",
    created_at: todayAt(15, 0),
  },
];

/* ── 5. Dues ─────────────────────────────────────────────────────────────── */

export type DemoDue = {
  id: string;
  customer_name: string;
  amount: number;
  due_date: string;
  status: "pending" | "partial";
  notes?: string;
};

export const DEMO_DUES: DemoDue[] = [
  {
    id: "d1d2d3d4-0001-4ccc-9000-000000000001",
    customer_name: "Rajesh Kumar",
    amount: 1400,
    due_date: offsetDate(-5),
    status: "pending",
    notes: "Monthly office chai tab",
  },
  {
    id: "d1d2d3d4-0002-4ccc-9000-000000000002",
    customer_name: "Priya Patel",
    amount: 800,
    due_date: offsetDate(-2),
    status: "partial",
    notes: "Paid ₹300 on Monday",
  },
  {
    id: "d1d2d3d4-0003-4ccc-9000-000000000003",
    customer_name: "Amit Singh",
    amount: 2200,
    due_date: offsetDate(-10),
    status: "pending",
    notes: "Event catering balance",
  },
  {
    id: "d1d2d3d4-0004-4ccc-9000-000000000004",
    customer_name: "Sunita Devi",
    amount: 650,
    due_date: offsetDate(3),
    status: "pending",
  },
  {
    id: "d1d2d3d4-0005-4ccc-9000-000000000005",
    customer_name: "Vikram Joshi",
    amount: 1100,
    due_date: offsetDate(7),
    status: "partial",
    notes: "Paid ₹500 advance",
  },
  {
    id: "d1d2d3d4-0006-4ccc-9000-000000000006",
    customer_name: "Neha Sharma",
    amount: 450,
    due_date: offsetDate(14),
    status: "pending",
    notes: "Next month party order",
  },
];

/* ── 6. Dashboard metrics (derived) ─────────────────────────────────────── */

const _todaySales = DEMO_SALES.reduce((sum, s) => sum + s.amount, 0);
const _todayExpenses = DEMO_EXPENSES.reduce((sum, e) => sum + e.amount, 0);
const _toCollect = DEMO_DUES.reduce((sum, d) => sum + d.amount, 0);

export const DEMO_DASHBOARD_METRICS = {
  shopName: DEMO_SHOP_NAME,
  todaySales: _todaySales,
  todayExpenses: _todayExpenses,
  profit: _todaySales - _todayExpenses,
  toCollect: _toCollect,
  pendingDuesCount: DEMO_DUES.length,
  weeklySales: DEMO_WEEKLY_SALES,
  recentExpenses: DEMO_EXPENSES.slice(0, 3),
  pendingDues: DEMO_DUES.slice(0, 3),
} as const;
