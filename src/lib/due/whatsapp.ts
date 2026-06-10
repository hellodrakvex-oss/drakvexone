import type { CustomerDue } from "./types";
import { formatCurrency } from "./utils";

/** Get WhatsApp reminder message based on due status */
export function buildWhatsAppReminder(due: CustomerDue, shopName: string = "our store"): string {
  const isOverdue = new Date(due.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  const firstName = due.customerName.split(" ")[0];
  const amountStr = formatCurrency(due.amount);
  const paidStr = formatCurrency(due.paidAmount || 0);
  const remainingStr = formatCurrency(due.amount - (due.paidAmount || 0));
  const dueDateStr = new Date(due.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  
  if (isOverdue) {
    return `Hello ${firstName},

Your payment is overdue.

Total Due: ₹${amountStr}
Paid: ₹${paidStr}
Remaining: ₹${remainingStr}

Due Date: ${dueDateStr}

Please clear the balance as soon as possible.

Thank you 🙏`;
  }

  if (due.paidAmount > 0) {
    return `Hello ${firstName},

Friendly reminder from ${shopName}.

Total Due: ₹${amountStr}
Paid: ₹${paidStr}
Remaining: ₹${remainingStr}

Due Date: ${dueDateStr}

Please clear the remaining balance.

Thank you 🙏`;
  }

  return `Hello ${firstName},

Friendly reminder from ${shopName}.

Pending Amount: ₹${amountStr}
Due Date: ${dueDateStr}

Please clear the payment at your convenience.

Thank you 🙏`;
}

/** Build WhatsApp URL with properly formatted phone number */
export function getWhatsAppUrl(phone: string | undefined, message: string): string {
  const encoded = encodeURIComponent(message);
  if (phone?.trim()) {
    let digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      digits = `91${digits}`;
    } else if (digits.startsWith("0")) {
      digits = `91${digits.slice(1)}`;
    }
    if (!digits.startsWith("91")) {
      digits = `91${digits}`;
    }
    return `https://wa.me/${digits}?text=${encoded}`;
  }
  // Fallback: open WhatsApp without specific contact
  return `https://wa.me/?text=${encoded}`;
}
