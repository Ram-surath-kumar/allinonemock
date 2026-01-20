import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export function SpecializedEquipmentManager({ roomId, equipmentList, onUpdate }) {
    const [items, setItems] = useState(equipmentList || []);
    const [loading, setLoading] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // New Item State
    const [newItem, setNewItem] = useState({
        category: 'Specialized',
        item_name: '',
        quantity: 1,
        details: { model: '', serial: '', status: 'Working' }
    });

    useEffect(() => {
        setItems(equipmentList || []);
    }, [equipmentList]);

    const handleAddItem = async () => {
        if (!roomId) {
            toast.error("Please save the room first before adding specialized equipment.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                room_id: roomId,
                category: newItem.category,
                item_name: newItem.item_name,
                quantity: Number(newItem.quantity),
                details: newItem.details
            };

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${baseUrl}/facilities/equipment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Failed to add equipment");
            const result = await response.json();

            setItems([...items, result.data]);
            toast.success("Equipment added");
            setIsAddOpen(false);
            setNewItem({ category: 'Specialized', item_name: '', quantity: 1, details: { model: '', serial: '', status: 'Working' } });

            if (onUpdate) onUpdate(); // Trigger refresh in parent

        } catch (error) {
            console.error(error);
            toast.error("Failed to add equipment");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to remove this item?")) return;
        try {
            setLoading(true);
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${baseUrl}/facilities/equipment/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error("Failed to delete");

            setItems(items.filter(i => i.id !== id));
            toast.success("Equipment removed");

            if (onUpdate) onUpdate();

        } catch (error) {
            console.error(error);
            toast.error("Failed to delete equipment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold">Specialized Inventory</h3>
                <Button size="sm" variant="outline" onClick={() => setIsAddOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Equipment
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                    No specialized equipment logged.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.item_name}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {item.details?.model && `Model: ${item.details.model} `}
                                        {item.details?.serial && `SN: ${item.details.serial}`}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} disabled={loading}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Specialized Equipment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Select
                                    value={newItem.category}
                                    onValueChange={(v) => setNewItem({ ...newItem, category: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Specialized">Specialized</SelectItem>
                                        <SelectItem value="Technology">Technology</SelectItem>
                                        <SelectItem value="Furniture">Furniture</SelectItem>
                                        <SelectItem value="Lab Equipment">Lab Equipment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Quantity</label>
                                <Input
                                    type="number"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Item Name</label>
                            <Input
                                placeholder="e.g. Electron Microscope"
                                value={newItem.item_name}
                                onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Model</label>
                                <Input
                                    placeholder="Optional"
                                    value={newItem.details.model}
                                    onChange={(e) => setNewItem({ ...newItem, details: { ...newItem.details, model: e.target.value } })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Serial Number</label>
                                <Input
                                    placeholder="Optional"
                                    value={newItem.details.serial}
                                    onChange={(e) => setNewItem({ ...newItem, details: { ...newItem.details, serial: e.target.value } })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddItem} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Add Item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
