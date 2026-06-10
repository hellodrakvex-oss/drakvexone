"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { QuickAddItem } from "@/lib/quick-add/types";

interface CustomQuantityModalProps {
  isOpen: boolean;
  item: QuickAddItem | null;
  onConfirm: (quantity: number, totalAmount: number, customName?: string) => void;
  onClose: () => void;
}

export function CustomQuantityModal({
  isOpen,
  item,
  onConfirm,
  onClose,
}: CustomQuantityModalProps) {
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  // Prefill with item values when modal opens
  useEffect(() => {
    if (isOpen && item) {
      setCustomName(item.name);
      setCustomPrice(item.price.toString());
      setQuantity("1");
    }
  }, [isOpen, item]);

  const handleConfirm = () => {
    const qty = parseInt(quantity) || 1;
    const price = parseFloat(customPrice) || (item?.price ?? 0);
    const totalAmount = qty * price;
    const name = customName.trim() || item?.name || "Custom Item";

    onConfirm(qty, totalAmount, name);
    resetForm();
  };

  const resetForm = () => {
    setCustomName("");
    setCustomPrice("");
    setQuantity("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!item) return null;

  const totalAmount =
    (parseInt(quantity) || 0) * (parseFloat(customPrice) || item.price);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full">
        <DialogHeader>
          <DialogTitle>Custom Quantity</DialogTitle>
          <DialogDescription>
            Enter custom details for this sale
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Custom Item Name */}
          <div className="space-y-2">
            <Label htmlFor="customName">Item Name (Optional)</Label>
            <Input
              id="customName"
              placeholder={item.name}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>

          {/* Custom Price */}
          <div className="space-y-2">
            <Label htmlFor="customPrice">Price per Item (Optional)</Label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">₹</span>
              <Input
                id="customPrice"
                type="number"
                placeholder={item.price.toString()}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />
          </div>

          {/* Total Amount */}
          {totalAmount > 0 && (
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-primary">
                ₹{totalAmount.toFixed(2)}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={!quantity || !customPrice}
            >
              Create Sale (₹{totalAmount.toFixed(2)})
            </Button>
            <Button variant="ghost" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
