"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Globe,
  LogOut,
  Store,
  User,
  Loader2,
  Shield,
  Trash2,
  RotateCcw,
  KeyRound,
  Mail,
  Phone,
  Briefcase,
  FileDown,
  Database,
  MessageSquare,
  Bug,
  Star,
  Info,
  BookOpen,
  Check,
  Upload,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AnimatedPage, itemVariants } from "@/components/animated-page";
import { DrakvexLogo } from "@/components/ui/drakvex-logo";
import { SettingsRow } from "@/components/settings/settings-row";
import { SettingsToggle } from "@/components/settings/settings-toggle";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/contexts/settings-context";
import { toast } from "sonner";
import { useState, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ChangePasswordModal } from "@/components/settings/change-password-modal";
import { ResetDataModal, DeleteAccountModal } from "@/components/settings/danger-zone-modals";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";

const BUSINESS_TYPES = [
  { value: "tea_shop", label: "Tea Shop" },
  { value: "petty_shop", label: "Petty Shop / General Store" },
  { value: "medical_store", label: "Medical Store" },
  { value: "mini_market", label: "Mini Market" },
  { value: "restaurant", label: "Restaurant / Cafe" },
  { value: "others", label: "Others" },
];

const settingsSchema = z.object({
  ownerName: z.string().min(2, "Owner name must be at least 2 characters").or(z.literal("")),
  shopName: z.string().min(2, "Shop name must be at least 2 characters").or(z.literal("")),
  shopPhone: z.string().min(10, "Please enter a valid phone number").or(z.literal("")),
});

// Reusable section header
function SectionHeader({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`p-2.5 rounded-xl ${color} ring-1`}>
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-base font-semibold text-foreground">{label}</h2>
    </div>
  );
}

// Reusable action row button
function ActionRow({
  icon: Icon,
  label,
  sublabel,
  onClick,
  href,
  iconColor = "text-muted-foreground",
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  href?: string;
  iconColor?: string;
  danger?: boolean;
}) {
  const cls = cn(
    "w-full flex items-center gap-3 p-4 rounded-[18px] border transition-colors group text-left",
    danger
      ? "bg-rose-500/8 border-rose-500/20 hover:bg-rose-500/15"
      : "bg-white/5 border-white/10 hover:bg-white/10"
  );

  const inner = (
    <>
      <div className={cn("p-2 rounded-xl transition-colors", danger ? "bg-rose-500/15 text-rose-400" : `bg-white/8 ${iconColor}`)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", danger ? "text-rose-400" : "text-foreground")}>{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </div>
      <ArrowLeft className={cn("w-4 h-4 rotate-180 shrink-0 transition-colors", danger ? "text-rose-400/60" : "text-muted-foreground/50 group-hover:text-muted-foreground")} />
    </>
  );

  if (href) return <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const {
    settings,
    updateSettings,
    setLanguage,
    setNotifications,
    setDueReminders,
    setDailySummary,
    isHydrated,
    hasUnsavedChanges,
    isSaving,
    saveSettings,
  } = useSettings();

  const [loggingOut, setLoggingOut] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSaveSettings = async () => {
    try {
      settingsSchema.parse({
        ownerName: settings.ownerName,
        shopName: settings.shopName,
        shopPhone: settings.shopPhone,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
        return;
      }
    }

    const result = await saveSettings();
    if (result.success) {
      toast.success("Settings saved successfully!");
    } else {
      toast.error(result.error || "Failed to save settings");
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch {
      toast.error("Failed to logout. Please try again.");
      setLoggingOut(false);
    }
  };



  const initials = settings.ownerName
    ? settings.ownerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.[0] || "U").toUpperCase();

  if (!isHydrated) {
    return (
      <AnimatedPage className="page-shell pb-40">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="page-shell pb-40">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 glass-panel-heavy border-x-0 border-t-0 border-b border-white/10 px-4 md:px-6 py-4 mb-6">
        <div className="flex items-center gap-3 max-w-2xl mx-auto w-full">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-[18px] bg-white/6 border border-white/10 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="flex-1 text-center text-[13px] font-bold tracking-widest uppercase text-muted-foreground">
            Settings
          </h1>
          {/* Save status pill */}
          <div className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all",
            isSaving
              ? "bg-primary/20 text-primary border-primary/30 animate-pulse"
              : hasUnsavedChanges
              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          )}>
            {isSaving ? "Saving…" : hasUnsavedChanges ? "Unsaved" : "Saved ✓"}
          </div>
        </div>
      </header>

      <div className="page-content space-y-5 max-w-2xl mx-auto">
        {/* Brand Header */}
       <motion.div
  variants={itemVariants}
  className="flex flex-col items-center justify-center mb-8 mt-2"
>
  <div className="relative w-20 h-20 drop-shadow-[0_0_25px_rgba(59,130,246,0.45)]">
    <Image
      src="/drakvexonebg logo.png"
      alt="Drakvex One"
      fill
      priority
      className="object-contain"
    />
  </div>

  <h2 className="text-xl font-black tracking-tight mt-4">
    DRAKVEX{" "}
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
      ONE
    </span>
  </h2>

  <p className="text-muted-foreground text-xs font-medium mt-1">
    Manage your shop & preferences
  </p>
</motion.div>

        {/* 1. Profile */}
        <motion.section variants={itemVariants} className="premium-card p-5 space-y-5">
          <SectionHeader icon={User} label="Profile" color="bg-primary/20 text-primary ring-primary/30" />

          {/* Avatar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pb-5 border-b border-white/8">
            <div className="shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/40 to-blue-500/30 border-2 border-primary/30 flex items-center justify-center text-2xl font-black text-primary">
                {initials}
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-foreground">{settings.ownerName || "Your Name"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Owner Name</label>
              <Input
                value={settings.ownerName}
                onChange={(e) => updateSettings({ ownerName: e.target.value })}
                className="h-12 rounded-[18px] bg-input/40 border-border focus-visible:ring-primary"
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email
              </label>
              <Input value={user?.email || ""} disabled className="h-12 rounded-[18px] bg-white/5 border-border/30 text-muted-foreground opacity-60" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone
              </label>
              <Input
                type="tel"
                value={settings.shopPhone}
                onChange={(e) => updateSettings({ shopPhone: e.target.value })}
                className="h-12 rounded-[18px] bg-input/40 border-border focus-visible:ring-primary"
                placeholder="10-digit phone number"
              />
            </div>
          </div>
        </motion.section>

        {/* 2. Shop Details */}
        <motion.section variants={itemVariants} className="premium-card p-5 space-y-5">
          <SectionHeader icon={Store} label="Shop Details" color="bg-secondary/20 text-secondary ring-secondary/30" />
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Shop Name</label>
              <Input
                value={settings.shopName}
                onChange={(e) => updateSettings({ shopName: e.target.value })}
                className="h-12 rounded-[18px] bg-input/40 border-border focus-visible:ring-secondary"
                placeholder="Your business name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> Business Type
              </label>
              <select
                value={settings.businessType}
                onChange={(e) => updateSettings({ businessType: e.target.value })}
                className="w-full h-12 rounded-[18px] bg-input/40 border border-border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-background text-foreground">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Address</label>
              <Input
                value={settings.shopAddress}
                onChange={(e) => updateSettings({ shopAddress: e.target.value })}
                className="h-12 rounded-[18px] bg-input/40 border-border focus-visible:ring-secondary"
                placeholder="Shop address"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                GST Number <span className="text-xs text-muted-foreground">(Optional)</span>
              </label>
              <Input
                value={settings.gstNumber}
                onChange={(e) => updateSettings({ gstNumber: e.target.value.toUpperCase() })}
                className="h-12 rounded-[18px] bg-input/40 border-border focus-visible:ring-secondary font-mono text-sm tracking-wider"
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
            </div>
          </div>
        </motion.section>


        {/* 4. Notifications */}
        <motion.section variants={itemVariants} className="premium-card p-5 space-y-4">
          <SectionHeader icon={Bell} label="Notifications" color="bg-chart-3/20 text-chart-3 ring-chart-3/30" />
          <div className="space-y-1">
            <SettingsRow label="Push Notifications" description="Receive real-time alerts on your device.">
              <SettingsToggle checked={settings.pushNotifications} onCheckedChange={setNotifications} aria-label="Toggle push notifications" />
            </SettingsRow>
            <div className="h-px bg-white/6 my-2" />
            <SettingsRow label="Due Reminders" description="Alerts before customer payments are overdue.">
              <SettingsToggle checked={settings.dueReminders} onCheckedChange={setDueReminders} aria-label="Toggle due reminders" />
            </SettingsRow>
            <div className="h-px bg-white/6 my-2" />
            <SettingsRow label="Daily Summary" description="Morning digest of yesterday's performance.">
              <SettingsToggle checked={settings.dailySummary} onCheckedChange={setDailySummary} aria-label="Toggle daily summary" />
            </SettingsRow>
          </div>
        </motion.section>

        {/* 5. Language */}
        <motion.section variants={itemVariants} className="premium-card p-5 space-y-4">
          <SectionHeader icon={Globe} label="Language" color="bg-blue-500/20 text-blue-400 ring-blue-500/30" />
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-primary/15 border border-primary/30 text-primary font-semibold text-sm ring-1 ring-primary/25"
            >
              <span className="text-2xl">🇺🇸</span>
              English
              <Check className="w-3.5 h-3.5" />
            </button>
            <div className="relative flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground/50 font-semibold text-sm cursor-not-allowed select-none">
              <span className="text-2xl grayscale opacity-50">🇮🇳</span>
              Tamil
              <span className="text-[9px] uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
          </div>
        </motion.section>

        {/* 6. Account & Security */}
        <motion.section variants={itemVariants} className="premium-card p-5 space-y-4">
          <SectionHeader icon={Shield} label="Account & Security" color="bg-amber-500/20 text-amber-400 ring-amber-500/30" />
          <div className="space-y-2">
            <ActionRow
              icon={KeyRound}
              label="Change Password"
              sublabel="Update your login credentials"
              iconColor="text-amber-400"
              onClick={() => setShowPasswordModal(true)}
            />
            <ActionRow
              icon={LogOut}
              label={loggingOut ? "Logging out…" : "Log Out"}
              sublabel="Sign out of your account"
              iconColor="text-muted-foreground"
              onClick={handleLogout}
            />
          </div>
        </motion.section>

        {/* 7. Reports & Backup */}
        <motion.section variants={itemVariants} className="premium-card p-5 space-y-4">
          <SectionHeader icon={Database} label="Reports & Backup" color="bg-emerald-500/20 text-emerald-400 ring-emerald-500/30" />
          <div className="p-4 rounded-2xl bg-white/3 border border-white/8 text-center space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">Coming in Phase 3</p>
            <p className="text-xs text-muted-foreground/60">PDF exports, Excel backups, and full data portability.</p>
          </div>
          <div className="space-y-2 opacity-50 pointer-events-none">
            <ActionRow icon={FileDown} label="Export PDF Report" sublabel="Download monthly business report" iconColor="text-blue-400" onClick={() => {}} />
            <ActionRow icon={BookOpen} label="Export Excel Report" sublabel="Full data in spreadsheet format" iconColor="text-emerald-400" onClick={() => {}} />
            <ActionRow icon={Database} label="Backup Business Data" sublabel="Create a full encrypted backup" iconColor="text-violet-400" onClick={() => {}} />
          </div>
        </motion.section>

        {/* 8. Support */}
        <motion.section variants={itemVariants} className="premium-card p-5 space-y-4">
          <SectionHeader icon={MessageSquare} label="Support" color="bg-[#25D366]/20 text-[#4ade80] ring-[#25D366]/30" />
          <div className="space-y-2">
            <ActionRow
              icon={MessageSquare}
              label="WhatsApp Support"
              sublabel="Chat with us directly"
              iconColor="text-[#4ade80]"
              href="https://wa.me/919150254231?text=Hi%20Drakvex%20Team%2C%20I%20need%20help%20with%20Drakvex%20One."
            />
            <ActionRow
              icon={Mail}
              label="Email Support"
              sublabel="hello@drakvex.in"
              iconColor="text-blue-400"
              href="mailto:hello@drakvex.in"
            />
            <ActionRow
              icon={Bug}
              label="Report a Bug"
              sublabel="Help us improve Drakvex One"
              iconColor="text-rose-400"
              href="mailto:hello@drakvex.in?subject=Bug%20Report%20-%20Drakvex%20One"
            />
            <ActionRow
              icon={Star}
              label="Request a Feature"
              sublabel="Suggest new ideas"
              iconColor="text-amber-400"
              href="mailto:hello@drakvex.in?subject=Feature%20Request%20-%20Drakvex%20One"
            />
          </div>
        </motion.section>

        {/* 9. About */}
        <motion.section variants={itemVariants} className="premium-card p-5 space-y-4">
          <SectionHeader icon={Info} label="About Drakvex One" color="bg-violet-500/20 text-violet-400 ring-violet-500/30" />
          <div className="space-y-3">
            {[
              { label: "Version", value: "3.0" },
              { label: "Build", value: `2026.06` },
              { label: "Environment", value: process.env.NODE_ENV === "production" ? "Production" : "Development" },
              { label: "Powered by", value: "Drakvex" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 px-4 rounded-2xl bg-white/4 border border-white/8">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* 10. Danger Zone */}
        <motion.section variants={itemVariants} className="premium-card p-5 space-y-4 bg-destructive/5 border border-destructive/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/8 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="relative z-10">
            <SectionHeader icon={Trash2} label="Danger Zone" color="bg-destructive/20 text-destructive ring-destructive/30" />
            <div className="space-y-2">
              <ActionRow
                icon={RotateCcw}
                label="Reset Business Data"
                sublabel="Delete all sales, expenses & dues"
                danger
                onClick={() => setShowResetModal(true)}
              />
              <ActionRow
                icon={Trash2}
                label="Delete Account"
                sublabel="Permanently remove your account"
                danger
                onClick={() => setShowDeleteModal(true)}
              />
            </div>
          </div>
        </motion.section>
      </div>

      {/* Sticky Save Button */}
      <div className="fixed left-0 right-0 z-30 flex items-center justify-center pointer-events-none pb-safe" style={{ bottom: "100px" }}>
        <div className="pointer-events-auto px-4">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={!hasUnsavedChanges || isSaving || !isHydrated}
            className={cn(
              "h-12 px-8 rounded-full font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-2xl text-sm backdrop-blur-md",
              !hasUnsavedChanges || !isHydrated
                ? "bg-muted/80 text-muted-foreground cursor-not-allowed border border-border/50"
                : isSaving
                ? "bg-primary text-primary-foreground border border-primary/50"
                : "bg-primary text-primary-foreground border border-primary hover:bg-primary/90 shadow-[0_4px_30px_rgb(var(--glow-primary)/0.5)]"
            )}
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving…</span></>
            ) : hasUnsavedChanges ? (
              <><Upload className="w-4 h-4" /><span>Save Changes</span></>
            ) : (
              <><Check className="w-4 h-4" /><span>Saved</span></>
            )}
          </button>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      <ResetDataModal open={showResetModal} onClose={() => setShowResetModal(false)} />
      <DeleteAccountModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
    </AnimatedPage>
  );
}
