export type PaymentMethod = "cash" | "upi" | "card";

export type Sale = {
  id: string;
  amount: number;
  customerName?: string;
  phone?: string;
  itemName?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
};

export type NewSaleInput = {
  amount: number;
  customerName?: string;
  phone?: string;
  itemName?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
};

export type DateFilter = "today" | "week" | "month" | "all";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
};
