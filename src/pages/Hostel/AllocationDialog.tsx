import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

interface AllocationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    hostels: any[];
    rooms: any[];
    beds: any[];
}

export function AllocationDialog({ open, onOpenChange, onSuccess, hostels, rooms, beds }: AllocationDialogProps) {
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<any[]>([]);

    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedHostel, setSelectedHostel] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [selectedBed, setSelectedBed] = useState('');

    useEffect(() => {
        if (open) {
            const fetchStudents = async () => {
                const res = await api.getUsers({ role: 'student' });
                if (res.data) setStudents(res.data);
            };
            fetchStudents();
        }
    }, [open]);

    const filteredRooms = rooms?.filter((r: any) => r.hostel_id === selectedHostel) || [];
    const filteredBeds = beds?.filter((b: any) => b.room_id === selectedRoom && b.status === 'VACANT') || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await api.allocateBed({
                student_id: selectedStudent,
                bed_id: selectedBed,
                status: 'ACTIVE'
            });

            if (response.error) throw new Error(response.error);

            toast.success('Bed allocated successfully');
            onSuccess();
            onOpenChange(false);

            // Reset form
            setSelectedStudent('');
            setSelectedBed('');
            setSelectedRoom('');
            setSelectedHostel('');

        } catch (error: any) {
            toast.error(error.message || 'Allocation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Allocate Bed</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Student</Label>
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                            <SelectContent>
                                {students.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.email})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Hostel</Label>
                        <Select value={selectedHostel} onValueChange={(val) => {
                            setSelectedHostel(val);
                            setSelectedRoom('');
                            setSelectedBed('');
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select hostel" />
                            </SelectTrigger>
                            <SelectContent>
                                {hostels?.map((h: any) => (
                                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Room</Label>
                        <Select value={selectedRoom} onValueChange={(val) => {
                            setSelectedRoom(val);
                            setSelectedBed('');
                        }} disabled={!selectedHostel}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select room" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredRooms.length === 0 ? (
                                    <SelectItem value="none" disabled>No rooms available</SelectItem>
                                ) : (
                                    filteredRooms.map((r: any) => (
                                        <SelectItem key={r.id} value={r.id}>Room {r.room_number || 'N/A'} ({r.room_type})</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Bed</Label>
                        <Select value={selectedBed} onValueChange={setSelectedBed} disabled={!selectedRoom}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select bed" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredBeds.length === 0 ? (
                                    <SelectItem value="none" disabled>No vacant beds</SelectItem>
                                ) : (
                                    filteredBeds.map((b: any) => (
                                        <SelectItem key={b.id} value={b.id}>{b.bed_number}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading || !selectedBed || !selectedStudent}>
                            {loading ? 'Allocating...' : 'Allocate'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
