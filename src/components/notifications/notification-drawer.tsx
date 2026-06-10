"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { useNotifications } from "@/contexts/notifications-context";
import { Bell, Check, Users, IndianRupee, TrendingDown, Info, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useRouter } from "next/navigation";

export function NotificationDrawer() {
  const { isOpen, openNotifications, closeNotifications, notifications, isLoading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const router = useRouter();

  const getIcon = (type: string) => {
    switch (type) {
      case 'due_reminder': return <Users className="w-5 h-5 text-orange-400" />;
      case 'daily_summary': return <IndianRupee className="w-5 h-5 text-primary" />;
      case 'expense_alert': return <TrendingDown className="w-5 h-5 text-rose-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'due_reminder': return "bg-orange-500/10 border-orange-500/20";
      case 'daily_summary': return "bg-primary/10 border-primary/20";
      case 'expense_alert': return "bg-rose-500/10 border-rose-500/20";
      default: return "bg-blue-500/10 border-blue-500/20";
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
      closeNotifications();
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => { if (open) openNotifications(); else closeNotifications(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[101] max-h-[85vh] flex flex-col rounded-t-[32px] glass-panel-heavy border border-white/10 outline-none max-w-lg mx-auto drakvex-cut-top pb-safe">
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-[32px]" />
          
          <div className="flex-1 overflow-y-auto pt-4 pb-8 px-4 relative z-10 custom-scrollbar">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 mb-6" />
            
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgb(var(--glow-primary)/0.3)]">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Drawer.Title className="text-xl font-bold tracking-tight text-foreground">Notifications</Drawer.Title>
                  <Drawer.Description className="text-xs text-muted-foreground mt-0.5">{unreadCount} unread messages</Drawer.Description>
                </div>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead()}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors group"
                  aria-label="Mark all as read"
                >
                  <Check className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              )}
            </div>

            <div className="space-y-3 relative z-10">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10">
                  <EmptyState 
                    title="No notifications yet"
                    description="You don't have any notifications right now."
                    illustration="dashboard"
                  />
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`relative overflow-hidden rounded-[20px] border p-4 cursor-pointer transition-all ${
                        notification.is_read 
                          ? 'bg-white/5 border-white/5 opacity-70 hover:bg-white/10' 
                          : `bg-white/10 border-white/20 shadow-lg ${getColorClass(notification.type)}`
                      }`}
                    >
                      {!notification.is_read && (
                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgb(var(--glow-primary))]" />
                      )}
                      
                      <div className="flex gap-4">
                        <div className="shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className={`text-sm font-semibold mb-1 ${notification.is_read ? 'text-foreground' : 'text-white'}`}>
                            {notification.title}
                          </p>
                          <p className="text-[13px] text-muted-foreground leading-snug">
                            {notification.body}
                          </p>
                          <p className="text-[10px] font-medium text-muted-foreground mt-2 uppercase tracking-wider">
                            {new Date(notification.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
