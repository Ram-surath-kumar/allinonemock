import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface EditHostelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    hostel: any;
}

export function EditHostelDialog({ open, onOpenChange, onSuccess, hostel }: EditHostelDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Boys',
        address: '',
        contact_info: '',
        description: ''
    });

    // Update form when hostel changes
    useEffect(() => {
        if (hostel) {
            setFormData({
                name: hostel.name || '',
                type: hostel.type || 'Boys',
                address: hostel.address || '',
                contact_info: hostel.contact_info || '',
                description: hostel.description || ''
            });
        }
    }, [hostel]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error('Please enter hostel name');
            return;
        }

        try {
            setLoading(true);

            // Auto-derive gender from hostel type
            let gender = 'Mixed';
            if (formData.type === 'Boys') {
                gender = 'Male';
            } else if (formData.type === 'Girls') {
                gender = 'Female';
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/hostel/${hostel.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    gender
                })
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error || 'Failed to update hostel');
            }

            toast.success('Hostel updated successfully');
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update hostel');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Hostel</DialogTitle>
                    <DialogDescription>
                        Update hostel information
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Hostel Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Block A, Main Hostel"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type *</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Boys">Boys</SelectItem>
                                <SelectItem value="Girls">Girls</SelectItem>
                                <SelectItem value="Staff">Staff</SelectItem>
                                <SelectItem value="Guest">Guest</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address/Location</Label>
                        <Input
                            id="address"
                            placeholder="Building location"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact">Contact Info</Label>
                        <Input
                            id="contact"
                            placeholder="Warden/Office number"
                            value={formData.contact_info}
                            onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            placeholder="Additional details..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Hostel'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
