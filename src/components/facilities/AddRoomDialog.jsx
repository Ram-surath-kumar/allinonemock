import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function AddRoomDialog({ open, onOpenChange, onSaved, buildings }) {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            floor_number: '0',
            status: 'Active',
            room_type: 'Classroom'
        }
    });

    const selectedBuildingId = watch('building_id');
    // Effect removed to prevent overwriting floor_number input by user. 
    // We trust the manual input now.

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const payload = {
                ...data,
                floor_number: Number(data.floor_number),
                capacity: Number(data.capacity) || 0
            };

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${baseUrl}/facilities/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to create room');
            const result = await response.json();

            toast.success("Room created successfully");
            reset();
            onOpenChange(false);
            if (onSaved) onSaved(result.data);

        } catch (error) {
            console.error(error);
            toast.error("Failed to create room");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Room</DialogTitle>
                    <DialogDescription>
                        Add a classroom, lab, or hall to a building.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Building</label>
                        <Select onValueChange={(v) => setValue('building_id', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Building" />
                            </SelectTrigger>
                            <SelectContent>
                                {buildings?.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" {...register('building_id', { required: "Building is required" })} />
                        {errors.building_id && <span className="text-xs text-red-500">{errors.building_id.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Floor</label>
                            <Input
                                type="number"
                                {...register('floor_number')}
                                placeholder="e.g. 0 for Ground, 1 for First"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Room Type</label>
                            <Select onValueChange={(v) => setValue('room_type', v)} defaultValue="Classroom">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Classroom">Classroom</SelectItem>
                                    <SelectItem value="Lab">Lab</SelectItem>
                                    <SelectItem value="Seminar Hall">Seminar Hall</SelectItem>
                                    <SelectItem value="Office">Office</SelectItem>
                                    <SelectItem value="Auditorium">Auditorium</SelectItem>
                                    <SelectItem value="Canteen">Canteen</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" {...register('room_type')} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Room Number / Code</label>
                        <Input
                            {...register('room_number', { required: "Room Number is required" })}
                            placeholder="e.g. 101 or A-01"
                        />
                        {errors.room_number && <span className="text-xs text-red-500">{errors.room_number.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Room Name (Optional)</label>
                        <Input
                            {...register('room_name')}
                            placeholder="e.g. Einstein Hall"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Capacity</label>
                        <Input
                            type="number"
                            {...register('capacity')}
                            placeholder="e.g. 60"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Room
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
