"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createInitialShop, updateProfile } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { AnimatedPage } from "@/components/animated-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Coffee, ShoppingBasket, ArrowRight, Check, Loader2, Pill, Utensils, Briefcase } from "lucide-react";
import { DrakvexLogo } from "@/components/ui/drakvex-logo";

const BUSINESS_TYPES = [
  { id: "tea_shop", label: "Tea Shop", icon: Coffee, desc: "Quick serving, high volume" },
  { id: "petty_shop", label: "Petty Shop / General Store", icon: Store, desc: "Daily essentials and local sales" },
  { id: "medical_store", label: "Medical Store", icon: Pill, desc: "Medicines and healthcare products" },
  { id: "mini_market", label: "Mini Market", icon: ShoppingBasket, desc: "Inventory and barcode focused" },
  { id: "restaurant", label: "Restaurant / Cafe", icon: Utensils, desc: "Tables, menus and orders" },
  { id: "others", label: "Others", icon: Briefcase, desc: "For all other businesses" },
];

export default function Setup() {
  const router = useRouter();
  const { user, profile, updateProfile: updateProfileContext, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user already has a shop name, redirect to dashboard
    if (!authLoading && user && profile?.shop_name) {
      router.replace("/dashboard");
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
// console.log("SETUP PAGE USER", supabaseUser);
    };
    checkUser();
  }, []);

  const handleNext = async () => {
    if (step === 1) {
      if (businessName.trim().length < 2) {
        toast.error("Please enter a valid business name");
        return;
      }
      setStep(2);
    } else {
      if (!businessType) {
        toast.error("Please select a business type");
        return;
      }
      
      if (!user) {
        toast.error("Authentication error. Please log in again.");
        router.push("/login");
        return;
      }

      setLoading(true);
      try {
        // 1. Update user profile with shop name, business type, and setup status
        await updateProfileContext({ 
          shop_name: businessName,
          business_type: businessType,
          setup_completed: true
        });
        // 2. Create initial shop entry
        await createInitialShop(user.id, {
          shop_name: businessName,
          phone: user.email || '',
        });

        toast.success("Shop setup complete!");
        router.push("/dashboard");
      } catch (error: any) {
        console.error("Setup error full object:", error);
        console.error("Setup error details:", {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          stack: error?.stack,
        });
        const displayMessage = error?.message || error?.code || "Failed to complete setup.";
        toast.error(displayMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AnimatedPage className="p-6 justify-center relative overflow-hidden">
      {/* Ambient Brand Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm mx-auto relative z-10">
        <div className="mb-10 text-center flex flex-col items-center">
          <DrakvexLogo size={48} variant="standard" />
          <h1 className="text-2xl font-black tracking-tight mt-4 mb-2">
            DRAKVEX <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">ONE</span>
          </h1>
        </div>

        <div className="premium-card drakvex-cut p-6">
          <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>
          <h1 className="text-2xl font-bold">
            {step === 1 ? "What's your shop's name?" : "Select your business type"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === 1 ? "This will be displayed on bills and reports." : "We'll customize your dashboard accordingly."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. My Tea Shop" 
                  className="h-14 text-lg" 
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  autoFocus
                />
              </div>
              <Button onClick={handleNext} className="w-full h-14 text-lg font-medium rounded-xl" disabled={loading || authLoading}>
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                {BUSINESS_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = businessType === type.id;
                  return (
                    <Card 
                      key={type.id}
                      className={`p-4 cursor-pointer border-2 transition-all ${isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                      onClick={() => setBusinessType(type.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">{type.label}</h3>
                          <p className="text-sm text-muted-foreground">{type.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="h-14 w-20 rounded-xl" disabled={loading || authLoading}>
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1 h-14 text-lg font-medium rounded-xl" disabled={loading || authLoading || !businessType}>
                  {loading || authLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </AnimatedPage>
  );
}
