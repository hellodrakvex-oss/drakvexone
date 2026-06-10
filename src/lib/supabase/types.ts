// Database Types - Auto-generated from Supabase schema

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          shop_name: string | null;
          phone: string;
          language: 'en' | 'ta';
          theme: 'light' | 'dark';
          currency: string;
          business_type: string | null;
          setup_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      shops: {
        Row: {
          id: string;
          user_id: string;
          shop_name: string;
          owner_name: string | null;
          address: string | null;
          city: string | null;
          phone: string;
          email: string | null;
          gst_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shops']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['shops']['Insert']>;
      };
      sales: {
        Row: {
          id: string;
          user_id: string;
          shop_id: string;
          customer_name: string | null;
          phone: string | null;
          amount: number;
          description: string | null;
          payment_method: string;
          reference_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['sales']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          shop_id: string;
          category: string;
          amount: number;
          description: string | null;
          reference_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
      customer_dues: {
        Row: {
          id: string;
          user_id: string;
          shop_id: string;
          customer_name: string;
          phone: string;
          amount: number;
          status: 'pending' | 'paid';
          due_date: string;
          notes: string | null;
          whatsapp_sent_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customer_dues']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customer_dues']['Insert']>;
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          theme: 'light' | 'dark';
          language: 'en' | 'ta';
          notifications_enabled: boolean;
          whatsapp_enabled: boolean;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['settings']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          shop_id: string;
          title: string;
          body: string;
          type: 'due_reminder' | 'daily_summary' | 'expense_alert' | 'system';
          is_read: boolean;
          action_url: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
    };
    Views: {
      customer_summary_view: {
        Row: {
          id: string;
          shop_id: string;
          customer_name: string;
          phone: string;
          total_sales: number;
          total_paid: number;
          total_due: number;
          transaction_count: number;
          last_activity: string | null;
          customer_since: string | null;
          last_purchase_date: string | null;
          last_due_date: string | null;
        };
      };
    };
  };
};

// Type helpers
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Shop = Database['public']['Tables']['shops']['Row'];
export type Sale = Database['public']['Tables']['sales']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type CustomerDue = Database['public']['Tables']['customer_dues']['Row'];
export type Settings = Database['public']['Tables']['settings']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type CustomerSummary = Database['public']['Views']['customer_summary_view']['Row'];

// Auth types
export type AuthUser = {
  id: string;
  email: string;
  profile?: Profile;
};

export type AuthSession = {
  user: AuthUser;
  expires_at: number;
};
