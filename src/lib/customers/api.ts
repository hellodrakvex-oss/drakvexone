import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CustomerActivity, CustomerSummary, CustomerSegment } from "./types";

/**
 * Build a server-side Supabase client from cookies.
 * Must only be called in Server Components or Route Handlers.
 */
async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

function calculateSegment(
  totalDue: number,
  lastActivity: string | null
): CustomerSegment {
  if (totalDue <= 0) return "Trusted";

  if (lastActivity) {
    const daysSinceActivity =
      (new Date().getTime() - new Date(lastActivity).getTime()) /
      (1000 * 3600 * 24);
    if (totalDue > 5000 || daysSinceActivity > 30) {
      return "Risk";
    }
  }
  return "Regular";
}

export async function getCustomers(shopId: string): Promise<CustomerSummary[]> {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("customer_summary_view")
    .select("*")
    .eq("shop_id", shopId)
    .order("last_activity", { ascending: false });

  if (error) {
    console.error("[Customers API] Failed to fetch customers:", {
      code: error.code,
      message: error.message,
      details: (error as any).details,
      hint: (error as any).hint,
    });
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    shopId: row.shop_id,
    customerName: row.customer_name,
    phone: row.phone,
    totalSales: Number(row.total_sales) || 0,
    totalPaid: Number(row.total_paid) || 0,
    totalDue: Number(row.total_due) || 0,
    transactionCount: Number(row.transaction_count) || 0,
    lastActivity: row.last_activity,
    customerSince: row.customer_since,
    lastPurchaseDate: row.last_purchase_date,
    lastDueDate: row.last_due_date,
    segment: calculateSegment(Number(row.total_due) || 0, row.last_activity),
  }));
}

export async function getCustomerById(
  shopId: string,
  id: string
): Promise<CustomerSummary | null> {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("customer_summary_view")
    .select("*")
    .eq("shop_id", shopId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[Customers API] Failed to fetch customer by id:", {
      code: error.code,
      message: error.message,
      details: (error as any).details,
      hint: (error as any).hint,
    });
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    shopId: data.shop_id,
    customerName: data.customer_name,
    phone: data.phone,
    totalSales: Number(data.total_sales) || 0,
    totalPaid: Number(data.total_paid) || 0,
    totalDue: Number(data.total_due) || 0,
    transactionCount: Number(data.transaction_count) || 0,
    lastActivity: data.last_activity,
    customerSince: data.customer_since,
    lastPurchaseDate: data.last_purchase_date,
    lastDueDate: data.last_due_date,
    segment: calculateSegment(Number(data.total_due) || 0, data.last_activity),
  };
}

export async function getCustomerActivity(
  shopId: string,
  customerName: string,
  phone: string
): Promise<CustomerActivity[]> {
  const supabase = await getServerSupabase();

  // Fetch sales
  const { data: salesData } = await supabase
    .from("sales")
    .select("id, amount, description, payment_method, created_at")
    .eq("shop_id", shopId)
    .eq("customer_name", customerName);

  // Fetch dues
  const { data: duesData } = await supabase
    .from("customer_dues")
    .select("id, amount, status, notes, created_at")
    .eq("shop_id", shopId)
    .eq("customer_name", customerName);

  // Optionally match by phone if provided
  let duePaymentsData: any[] = [];
  if (duesData && duesData.length > 0) {
    const dueIds = duesData.map((d) => d.id);
    const { data: payments } = await supabase
      .from("due_payments")
      .select("id, amount, notes, payment_date")
      .in("due_id", dueIds);
    duePaymentsData = payments || [];
  }

  const activities: CustomerActivity[] = [];

  (salesData || []).forEach((sale) => {
    activities.push({
      id: sale.id,
      type: "sale",
      amount: sale.amount,
      date: sale.created_at,
      description: sale.description || `Sale (${sale.payment_method})`,
    });
  });

  (duesData || []).forEach((due) => {
    activities.push({
      id: due.id,
      type: "due",
      amount: due.amount,
      date: due.created_at,
      description: due.notes || "Due created",
      status: due.status,
    });
  });

  (duePaymentsData || []).forEach((payment) => {
    activities.push({
      id: payment.id,
      type: "payment",
      amount: payment.amount,
      date: payment.payment_date,
      description: payment.notes || "Due payment received",
    });
  });

  // Sort by date descending
  activities.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return activities;
}
