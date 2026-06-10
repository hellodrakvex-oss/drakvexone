"use client";

import { useState } from "react";
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
import { Card } from "@/components/ui/card";
import { Edit2, Trash2, Plus, GripVertical } from "lucide-react";
import { useQuickAdd } from "@/contexts/quick-add-context";
import type { QuickAddItem, NewQuickAddInput, UpdateQuickAddInput } from "@/lib/quick-add/types";

interface QuickAddManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddManagement({ isOpen, onClose }: QuickAddManagementProps) {
  const { items, addItem, updateItem, deleteItem, reorderItems } = useQuickAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleEditStart = (item: QuickAddItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(item.price.toString());
    setEditIcon(item.icon || "");
  };

  const handleEditSave = async () => {
    if (!editingId || !editName || !editPrice) return;

    const updateInput: UpdateQuickAddInput = {
      name: editName,
      price: parseFloat(editPrice),
      icon: editIcon || undefined,
    };

    await updateItem(editingId, updateInput);
    setEditingId(null);
  };

  const handleAddItem = async () => {
    if (!newName || !newPrice) return;

    const addInput: NewQuickAddInput = {
      name: newName,
      price: parseFloat(newPrice),
      icon: newIcon || undefined,
    };

    await addItem(addInput);
    setNewName("");
    setNewPrice("");
    setNewIcon("");
    setIsAdding(false);
  };

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = items.findIndex((i) => i.id === draggedItem);
    const targetIndex = items.findIndex((i) => i.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...items];
    [newOrder[draggedIndex], newOrder[targetIndex]] = [
      newOrder[targetIndex],
      newOrder[draggedIndex],
    ];

    const reorderData = newOrder.map((item, index) => ({
      id: item.id,
      sortOrder: index,
    }));

    await reorderItems(reorderData);
    setDraggedItem(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Quick Add Items</DialogTitle>
          <DialogDescription>
            Add, edit, delete, or reorder your quick add items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Item Section */}
          {!isAdding ? (
            <Button
              onClick={() => setIsAdding(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Item
            </Button>
          ) : (
            <Card className="p-4 space-y-3 bg-primary/5 border-primary/20">
              <h3 className="font-semibold">New Quick Add Item</h3>

              <div className="space-y-2">
                <Label htmlFor="newName">Name</Label>
                <Input
                  id="newName"
                  placeholder="Item name (e.g., Tea, Coffee)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPrice">Price</Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">₹</span>
                  <Input
                    id="newPrice"
                    type="number"
                    placeholder="Price"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newIcon">Icon Name (Optional)</Label>
                <Input
                  id="newIcon"
                  placeholder="e.g., coffee, cup-soda"
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddItem}
                  className="flex-1"
                  disabled={!newName || !newPrice}
                >
                  Save Item
                </Button>
                <Button
                  onClick={() => setIsAdding(false)}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Items List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Your Items ({items.length})</h3>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No quick add items yet. Add one to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(item.id)}
                    className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors cursor-move"
                  >
                    {/* Drag handle */}
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                    {/* Item info */}
                    {editingId === item.id ? (
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Item name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <div className="flex-1 flex items-center gap-1">
                            <span>₹</span>
                            <Input
                              type="number"
                              placeholder="Price"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <Input
                            placeholder="Icon"
                            value={editIcon}
                            onChange={(e) => setEditIcon(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      {editingId === item.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={handleEditSave}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditStart(item)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
