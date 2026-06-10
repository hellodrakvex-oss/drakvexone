"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSales } from "@/contexts/sales-context";
import { useQuickAdd } from "@/contexts/quick-add-context";
import { QuantitySelectorModal } from "./quantity-selector-modal";
import { CustomQuantityModal } from "./custom-quantity-modal";
import { QuickAddManagement } from "./quick-add-management";
import { getIconComponent } from "@/lib/quick-add/icons";
import type { QuickAddItem } from "@/lib/quick-add/types";

export function SalesQuickActions() {
  const { addSale } = useSales();
  const { items: quickAddItems } = useQuickAdd();
  
  const [selectedItem, setSelectedItem] = useState<QuickAddItem | null>(null);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [showCustomQuantity, setShowCustomQuantity] = useState(false);
  const [showManagement, setShowManagement] = useState(false);

  const handleItemClick = (item: QuickAddItem) => {
    setSelectedItem(item);
    setShowQuantitySelector(true);
  };

  const handleQuantitySelect = async (quantity: number) => {
    if (!selectedItem) return;

    const amount = selectedItem.price * quantity;
    const itemName = `${selectedItem.name} × ${quantity}`;

    try {
// console.log("QUICK ADD CLICKED - Quantity:", quantity);
// console.log("PAYLOAD", { amount, itemName, quantity });

      await addSale({
        amount,
        itemName,
        paymentMethod: "cash",
      });

      setShowQuantitySelector(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("[Quick Add] Error:", error);
    }
  };

  const handleCustomQuantity = (quantity: number, totalAmount: number, customName?: string) => {
    setShowCustomQuantity(false);
    setShowQuantitySelector(false);

    try {
// console.log("QUICK ADD CUSTOM - Quantity:", quantity, "Total:", totalAmount);
// console.log("PAYLOAD", { amount: totalAmount, itemName: customName, quantity });

      addSale({
        amount: totalAmount,
        itemName: customName,
        paymentMethod: "cash",
      });

      setSelectedItem(null);
    } catch (error) {
      console.error("[Quick Add] Error:", error);
    }
  };

  if (quickAddItems.length === 0) {
    return (
      <div className="space-y-2.5 min-w-0">
        <div className="flex items-center justify-between px-0.5">
          <p className="saas-label">Quick add</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowManagement(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No quick add items configured
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowManagement(true)}
          >
            Set up Quick Add Items
          </Button>
        </div>
        <QuickAddManagement isOpen={showManagement} onClose={() => setShowManagement(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-2.5 min-w-0">
      <div className="flex items-center justify-between px-0.5">
        <p className="saas-label">Quick add</p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowManagement(true)}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2 min-w-0">
        {quickAddItems.map((item) => {
          const Icon = getIconComponent(item.icon);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              className="flex flex-col items-center justify-center gap-1.5 min-h-[76px] rounded-2xl premium-card border-0 ring-0 p-2 active:scale-[0.97] transition-transform min-w-0"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary ring-1 ring-primary/25">
                {Icon && <Icon className="w-4 h-4" />}
              </div>
              <span className="text-[11px] font-semibold text-foreground/90 truncate w-full text-center">
                {item.name}
              </span>
              <span className="text-[10px] font-medium text-primary tabular-nums">
                ₹{item.price}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modals */}
      <QuantitySelectorModal
        isOpen={showQuantitySelector}
        item={selectedItem}
        onQuantitySelect={handleQuantitySelect}
        onCustomQuantity={() => setShowCustomQuantity(true)}
        onClose={() => {
          setShowQuantitySelector(false);
          setSelectedItem(null);
        }}
      />

      <CustomQuantityModal
        isOpen={showCustomQuantity}
        item={selectedItem}
        onConfirm={handleCustomQuantity}
        onClose={() => setShowCustomQuantity(false)}
      />

      <QuickAddManagement
        isOpen={showManagement}
        onClose={() => setShowManagement(false)}
      />
    </div>
  );
}
