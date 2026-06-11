"use server"

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function deleteAccountAction() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase configuration.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Cannot securely delete user.");
  }

  // 1. Authenticate user request
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // 2. Initialize Admin Client
  const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // 3. Delete Business Data
  const { data: shop } = await supabaseAdmin
    .from("shops")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (shop?.id) {
    await Promise.allSettled([
      supabaseAdmin.from("sales").delete().eq("shop_id", shop.id),
      supabaseAdmin.from("expenses").delete().eq("shop_id", shop.id),
      supabaseAdmin.from("customer_dues").delete().eq("shop_id", shop.id),
    ]);
    
    await supabaseAdmin.from("shops").delete().eq("id", shop.id);
  }

  // Delete associated user data (settings, profile, payments, notifications)
  await Promise.allSettled([
    supabaseAdmin.from("settings").delete().eq("user_id", user.id),
    supabaseAdmin.from("profiles").delete().eq("id", user.id),
    supabaseAdmin.from("notifications").delete().eq("user_id", user.id),
    supabaseAdmin.from("due_payments").delete().eq("user_id", user.id),
  ]);

  // 4. Delete Auth User from Supabase
  const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (deleteUserError) {
    console.error("Failed to delete user from Supabase Auth:", deleteUserError);
    throw new Error("Failed to delete user account entirely. Please contact support.");
  }

  return { success: true };
}
