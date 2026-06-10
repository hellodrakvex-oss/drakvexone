import { supabase } from './client';
import type { AppSettings } from '@/lib/settings/types';

/**
 * Fetch settings from Supabase (profiles, shops, settings tables)
 */
export async function fetchSettingsFromSupabase(userId: string): Promise<AppSettings | null> {
  try {
    const [shopResult, settingsResult, profileResult] = await Promise.all([
      supabase
        .from('shops')
        .select('shop_name, owner_name, address, phone, gst_number')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('settings')
        .select('language, notifications_enabled, push_notifications, due_reminders, daily_summary')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('business_type')
        .eq('id', userId)
        .maybeSingle(),
    ]);

    if (shopResult.error) console.error('[Settings] Shop fetch error:', shopResult.error.message);
    if (settingsResult.error) console.error('[Settings] Settings fetch error:', settingsResult.error.message);
    if (profileResult.error) console.error('[Settings] Profile fetch error:', profileResult.error.message);

    const shop = shopResult.data;
    const settingsRow = settingsResult.data;
    const profile = profileResult.data;

    const appSettings: AppSettings = {
      ownerName: shop?.owner_name || '',
      shopName: shop?.shop_name || '',
      shopPhone: shop?.phone || '',
      shopAddress: shop?.address || '',
      gstNumber: (shop as any)?.gst_number || '',
      businessType: (profile as any)?.business_type || 'retail',
      language: (settingsRow?.language as any) || 'en',
      pushNotifications: (settingsRow as any)?.push_notifications ?? false,
      dueReminders: (settingsRow as any)?.due_reminders ?? true,
      dailySummary: (settingsRow as any)?.daily_summary ?? true,
    };

    return appSettings;
  } catch (error) {
    console.error('[Settings] Fetch exception:', error);
    return null;
  }
}

/**
 * Save settings to Supabase (profiles, shops, settings tables)
 */
export async function saveSettingsToSupabase(
  userId: string,
  settings: AppSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch the primary shop for this user
    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    // 2. Update or insert shop
    if (shop?.id) {
      const { error: shopError } = await supabase
        .from('shops')
        .update({
          shop_name: settings.shopName,
          owner_name: settings.ownerName,
          address: settings.shopAddress,
          phone: settings.shopPhone,
          gst_number: settings.gstNumber,
        } as any)
        .eq('id', shop.id);
      if (shopError) return { success: false, error: shopError.message };
    } else {
      await supabase.from('shops').insert({
        user_id: userId,
        shop_name: settings.shopName || 'My Shop',
        owner_name: settings.ownerName,
        address: settings.shopAddress,
        phone: settings.shopPhone,
        gst_number: settings.gstNumber,
      } as any);
    }

    // 3. Update profile (business_type + avatar_url)
    await supabase
      .from('profiles')
      .update({ business_type: settings.businessType } as any)
      .eq('id', userId);

    // 4. Upsert settings row
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('settings')
        .update({

          language: settings.language,
          notifications_enabled: settings.pushNotifications,
          push_notifications: settings.pushNotifications,
          due_reminders: settings.dueReminders,
          daily_summary: settings.dailySummary,
        } as any)
        .eq('id', existing.id);
    } else {
      await supabase.from('settings').insert({
        user_id: userId,

        language: settings.language,
        notifications_enabled: settings.pushNotifications,
        push_notifications: settings.pushNotifications,
        due_reminders: settings.dueReminders,
        daily_summary: settings.dailySummary,
        currency: 'INR',
        whatsapp_enabled: false,
      } as any);
    }

    return { success: true };
  } catch (error) {
    console.error('[Settings] Save exception:', error);
    return { success: false, error: String(error) };
  }
}
