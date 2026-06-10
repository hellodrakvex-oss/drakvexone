import { Suspense } from "react";
import { Users } from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { getCustomers } from "@/lib/customers/api";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CustomerListClient } from "./customer-list-client";

async function CustomersList() {
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
    console.error("[Customers Page] Failed to fetch shop:", {
      code: shopError.code,
      message: shopError.message,
      details: shopError.details,
      hint: shopError.hint,
    });
  }

  if (!shop) {
    redirect("/setup");
  }

  const customers = await getCustomers(shop.id);

  return <CustomerListClient customers={customers} />;
}

export default function CustomersPage() {
  return (
    <AnimatedPage className="min-h-screen bg-background">
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gradient mb-2">Customers</h1>
        <p className="text-muted-foreground">Manage your customer relationships and dues.</p>
      </div>

      <div className="px-5">
        <Suspense fallback={<div className="animate-pulse h-32 bg-muted/50 rounded-2xl"></div>}>
          <CustomersList />
        </Suspense>
      </div>
    </AnimatedPage>
  );
}
