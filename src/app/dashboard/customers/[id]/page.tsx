import { Suspense } from "react";
import { ArrowLeft, Phone, Calendar, IndianRupee, Receipt, AlertCircle } from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { getCustomerById, getCustomerActivity } from "@/lib/customers/api";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

async function CustomerDetails({ id }: { id: string }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resolve shop directly using the server client (has session cookie)
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (shopError) {
    console.error("[Customer Profile] Failed to fetch shop:", {
      code: shopError.code,
      message: shopError.message,
      details: shopError.details,
      hint: shopError.hint,
    });
  }

  if (!shop) redirect("/setup");

  const customer = await getCustomerById(shop.id, id);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <h3 className="text-xl font-semibold mb-2">Customer not found</h3>
        <Link href="/dashboard/customers" className="text-primary mt-4">
          Return to Customers
        </Link>
      </div>
    );
  }

  const activities = await getCustomerActivity(shop.id, customer.customerName, customer.phone || "");

  return (
    <div className="space-y-6 pb-24">
      {/* Header Info */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
        
        <div className="relative">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{customer.customerName}</h2>
              {customer.phone && (
                <div className="flex items-center text-muted-foreground mt-1">
                  <Phone className="w-3.5 h-3.5 mr-1.5" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
              )}
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              customer.segment === 'Trusted' ? 'bg-emerald-500/10 text-emerald-500' :
              customer.segment === 'Risk' ? 'bg-rose-500/10 text-rose-500' :
              'bg-blue-500/10 text-blue-500'
            }`}>
              {customer.segment}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-background/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Total Purchases</p>
              <p className="text-lg font-semibold">₹{(customer.totalSales || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Current Due</p>
              <p className={`text-lg font-semibold ${customer.totalDue > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                ₹{(customer.totalDue || 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
              <p className="text-lg font-semibold">₹{(customer.totalPaid || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Transactions</p>
              <p className="text-lg font-semibold">{customer.transactionCount}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50 flex items-center text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            <span>Customer since {customer.customerSince ? new Date(customer.customerSince).toLocaleDateString() : "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div>
        <h3 className="text-lg font-semibold mb-4 px-1">Activity Timeline</h3>
        
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-sm px-1">No activity recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    activity.type === 'sale' ? 'bg-blue-500/10 text-blue-500' :
                    activity.type === 'due' ? 'bg-rose-500/10 text-rose-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {activity.type === 'sale' ? <Receipt className="w-4 h-4" /> :
                     activity.type === 'due' ? <AlertCircle className="w-4 h-4" /> :
                     <IndianRupee className="w-4 h-4" />}
                  </div>
                  <div className="w-px h-full bg-border mt-2" />
                </div>
                
                <div className="glass-panel p-3.5 rounded-2xl flex-1 mb-2">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-sm">
                      {activity.type === 'sale' ? 'Purchase' :
                       activity.type === 'due' ? 'Due Added' : 'Payment Received'}
                    </p>
                    <p className={`font-semibold text-sm ${
                      activity.type === 'sale' ? 'text-foreground' :
                      activity.type === 'due' ? 'text-rose-500' : 'text-emerald-500'
                    }`}>
                      {activity.type === 'payment' ? '+' : ''}₹{(activity.amount || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{activity.description}</p>
                  <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                    {new Date(activity.date).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function CustomerProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return (
    <AnimatedPage className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard/customers" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold">Customer Profile</h1>
        </div>
      </div>

      <div className="px-4 pt-6">
        <Suspense fallback={<div className="animate-pulse h-64 bg-muted/50 rounded-2xl"></div>}>
          <CustomerDetails id={params.id} />
        </Suspense>
      </div>
    </AnimatedPage>
  );
}
