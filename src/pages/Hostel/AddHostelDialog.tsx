import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { api } from '@/services/api';
import { toast } from 'sonner';

interface AddHostelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AddHostelDialog({ open, onOpenChange, onSuccess }: AddHostelDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Boys',
        capacity: '',
        gender: 'Male',
        address: '',
        contact_info: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.capacity) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            const response = await api.createHostel({
                ...formData,
                capacity: parseInt(formData.capacity),
                facilities: {} // Default empty facilities
            });

            if (response.error) {
                throw new Error(response.error);
            }

            toast.success('Hostel created successfully');
            onSuccess();
            onOpenChange(false);
            setFormData({
                name: '',
                type: 'Boys',
                capacity: '',
                gender: 'Male',
                address: '',
                contact_info: ''
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to create hostel');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Hostel</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Hostel Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Block A, Main Hostel"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
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
                            <Label htmlFor="capacity">Capacity</Label>
                            <Input
                                id="capacity"
                                type="number"
                                placeholder="Total beds"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                required
                            />
                        </div>
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

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Hostel'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
