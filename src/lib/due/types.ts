export type DueStatus = "pending" | "paid";

export type StatusFilter = "pending" | "paid" | "all";

export type DuePayment = {
  id: string;
  dueId: string;
  amount: number;
  paymentDate: string;
  notes?: string;
  createdAt: string;
};

export type CustomerDue = {
  id: string;
  customerName: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  phone?: string;
  notes?: string;
  status: DueStatus;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  payments?: DuePayment[];
};

export type NewDueInput = {
  customerName: string;
  amount: number;
  dueDate: string;
  phone: string;
  notes?: string;
};

export type UpdateDueInput = NewDueInput;
