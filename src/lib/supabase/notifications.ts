import { supabase } from './client';
import type { Notification } from './types';

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Notifications] Fetch error:', error.message ?? 'Unknown error');
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Notifications] Fetch error.');
    return [];
  }
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('[Notifications] Mark as read error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Notifications] Mark as read exception:', error);
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('[Notifications] Mark all as read error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Notifications] Mark all as read exception:', error);
    return false;
  }
}

// Frontend utility for Phase 2.5 to generate local notifications manually
export async function createNotification(
  userId: string,
  shopId: string,
  title: string,
  body: string,
  type: Notification['type'],
  actionUrl?: string,
  metadata?: any
): Promise<Notification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        shop_id: shopId,
        title,
        body,
        type,
        action_url: actionUrl,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('[Notifications] Create error:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('[Notifications] Create exception:', error);
    return null;
  }
}
