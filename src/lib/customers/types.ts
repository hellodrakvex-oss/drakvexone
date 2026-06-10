export type CustomerSegment = "Trusted" | "Regular" | "Risk";

export type CustomerSummary = {
  id: string;
  shopId: string;
  customerName: string;
  phone: string;
  totalSales: number;
  totalPaid: number;
  totalDue: number;
  transactionCount: number;
  lastActivity: string | null;
  customerSince: string | null;
  lastPurchaseDate: string | null;
  lastDueDate: string | null;
  segment: CustomerSegment;
};

export type CustomerActivityType = "sale" | "due" | "payment";

export type CustomerActivity = {
  id: string; // Composite or actual ID
  type: CustomerActivityType;
  amount: number;
  date: string;
  description?: string;
  status?: string; // For dues
};
