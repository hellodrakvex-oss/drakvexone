"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { QuickAddItem } from "@/lib/quick-add/types";

interface QuantitySelectorModalProps {
  isOpen: boolean;
  item: QuickAddItem | null;
  onQuantitySelect: (quantity: number) => void;
  onCustomQuantity: () => void;
  onClose: () => void;
}

export function QuantitySelectorModal({
  isOpen,
  item,
  onQuantitySelect,
  onCustomQuantity,
  onClose,
}: QuantitySelectorModalProps) {
  const quantities = [1, 2, 3, 4, 5, 6];

  if (!item) return null;

  const totalPrice = (quantity: number) => item.price * quantity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>
            Select quantity (₹{item.price} per item)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick quantity buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quantities.map((qty) => (
              <Button
                key={qty}
                variant="outline"
                className="flex flex-col gap-1"
                onClick={() => onQuantitySelect(qty)}
              >
                <span className="text-lg font-semibold">{qty}</span>
                <span className="text-xs text-muted-foreground">
                  ₹{totalPrice(qty)}
                </span>
              </Button>
            ))}
          </div>

          {/* Others button */}
          <Button
            variant="secondary"
            className="w-full"
            onClick={onCustomQuantity}
          >
            Others (Custom Quantity)
          </Button>

          {/* Cancel button */}
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
