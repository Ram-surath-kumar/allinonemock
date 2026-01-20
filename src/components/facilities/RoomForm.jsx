import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SpecializedEquipmentManager } from '@/components/facilities/SpecializedEquipmentManager';
import { RoomBookingManager } from '@/components/facilities/RoomBookingManager';
import { DocumentManager } from '@/components/facilities/DocumentManager';

export default function RoomForm({ roomId, onSaved, onAddRoom }) {
    const [loading, setLoading] = useState(false);
    const [savedRoom, setSavedRoom] = useState(null); // RAW data from backend to preserve hidden fields
    const [equipmentList, setEquipmentList] = useState([]); // For specialized items array

    const [activeTab, setActiveTab] = useState("identification");
    const [isViewMode, setIsViewMode] = useState(false); // Toggle between Edit Form and View Details
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, control } = useForm({
        defaultValues: {
            // Flat structure matching mapped JSONB stores in backend
            room_number: '',
            room_name: '',
            floor_number: '',
            room_type: '',
            status: 'Active',
            capacity: '',

            // JSONB Buckets
            physical_specs: {
                carpet_area: '', built_up_area: '', height: '', window_area: '',
                flooring: '', ceiling: '', paint_condition: ''
            },

            // Equipment is split into categories in UI, but stored hierarchically in state for JSON
            equipment: {
                furniture: {
                    desks_count: '', chairs_count: '', chair_type: '',
                    cupboards_count: '', whiteboards_count: '', noticeboards_count: ''
                },
                technology: {
                    has_projector: false, projector_type: '',
                    has_screen: false, screen_size: '',
                    has_sound: false,
                    computer_count: '', computer_specs: '',
                    printer_count: '',
                    cctv_count: '',
                    has_wifi: false,
                    has_doc_camera: false
                },
                utilities: {
                    ac_count: '', fan_count: '',
                    light_count: '', light_type: '',
                    outlet_count: '', dustbin_count: '',
                    has_water: false
                },
                specialized: [] // For lab equipment list
            },

            accessibility: {
                wheelchair: false,
                ramps: false,
                accessible_toilet: false, toilet_distance: '',
                accessible_parking: false, parking_distance: '',
                tactile: false,
                braille: false,
                hearing_loop: false
            },

            maintenance: {
                cleanliness_score: 5,
                last_cleaned: '',
                last_maintained: '',
                next_schedule: '',
                repairs_pending: false,
                notes: ''
            },

            allocation: {
                dept_assigned: '',
                faculty: '',
                academic_year: '',
                daily_schedule: '',
                sched_hours: '',
                used_hours: '',
                idle_hours: '',
                utilization_rate: ''
            },

            docs: {} // Placeholder for file references
        }
    });

    useEffect(() => {
        if (roomId) {
            fetchRoomDetails();
            setIsViewMode(false); // Reset to edit mode when switching rooms
        } else {
            // Reset to defaults
            reset({
                status: 'Active',
                physical_specs: {},
                equipment: { furniture: {}, technology: {}, utilities: {}, specialized: [] },
                accessibility: {},
                maintenance: { cleanliness_score: 5 },
                allocation: {}
            });
            setEquipmentList([]);
            setSavedRoom(null);
            setIsViewMode(false);
        }
    }, [roomId]);

    const fetchRoomDetails = async () => {
        try {
            setLoading(true);
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${baseUrl}/facilities/rooms/${roomId}`);
            const result = await response.json();

            if (result.data) {
                const room = result.data;
                setSavedRoom(room); // Persist full object
                // Defensively merge with defaults to avoid uncontrolled input errors
                reset({
                    ...room,
                    physical_specs: room.physical_specs || {},
                    equipment: room.equipment_json || { furniture: {}, technology: {}, utilities: {}, specialized: [] },
                    accessibility: room.accessibility || {},
                    maintenance: room.maintenance || { cleanliness_score: 5 },
                    allocation: room.allocation || {}
                });
                setEquipmentList(room.equipment_list || []); // Uses distinct table if implemented, or fallback
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load room details");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            // Transform data if necessary before sending
            const payload = {
                ...data,
                // Ensure numeric type conversion if backend expects it strictly, 
                // though JS usually handles JSON flexibility well.
                capacity: Number(data.capacity) || 0,
                floor_number: Number(data.floor_number) || 0,
                // Sanitize Enums: Empty string violates CHECK constraint, so send NULL key used by Supabase/Postgres
                room_type: data.room_type || null,
                status: data.status || 'Active',

                // Save the categorized equipment state into the JSONB 'equipment' column
                // but we must remove API-only fields that aren't columns.
                equipment_json: undefined,
                equipment_list: undefined,
                // Critical: Ensure ID is present for UPSERT to work as UPDATE.
                // If roomId is passed, use it.
                id: roomId,
                // Ensure building_id is preserved from original fetch or form
                building_id: savedRoom?.building_id || data.building_id,
            };

            // Clean up undefined/nulls if needed, or just delete them
            delete payload.equipment_json;
            delete payload.equipment_list;
            // Remove the building object if it exists (from the backend join)
            // as it is not a column in the rooms table and causes upsert failure
            delete payload.building;

            // Verify connection URL
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const url = `${baseUrl}/facilities/rooms`;

            console.log("Saving to:", url);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.data) {
                toast.success("Room saved successfully");
                setSavedRoom(result.data); // Update local state with latest verified data
                setIsViewMode(true); // Switch to View Mode
                if (onSaved) onSaved(result.data);
            } else {
                console.error("Save error:", result);
                const msg = result.error?.message || result.error || "Failed to save room";
                toast.error(typeof msg === 'object' ? JSON.stringify(msg) : msg);
            }
        } catch (error) {
            console.error("Room Save Exception:", error);
            toast.error(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };



    if (isViewMode && savedRoom) {
        return (
            <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
                <div className="flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-green-700">
                            Room {savedRoom.room_number || 'Details'} Saved
                        </h2>
                        <p className="text-muted-foreground">Successfully updated room configuration.</p>
                    </div>
                    <Button onClick={() => setIsViewMode(false)} variant="outline">
                        <Loader2 className="mr-2 h-4 w-4 opacity-0" /> {/* Spacer */}
                        Edit Room Again
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Room Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">Room Name</span>
                                    <span className="font-medium">{savedRoom.room_name || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Room Number</span>
                                    <span className="font-medium">{savedRoom.room_number}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Building</span>
                                    <span className="font-medium">{savedRoom.building?.code || 'MAB'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Floor</span>
                                    <span className="font-medium">{savedRoom.floor_number}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Type</span>
                                    <span className="font-medium">{savedRoom.room_type || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Status</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${savedRoom.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {savedRoom.status}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Capabilities & Features</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm max-h-[400px] overflow-y-auto pr-2">
                                {/* Physical Specs */}
                                <div>
                                    <h4 className="font-semibold mb-2 text-muted-foreground uppercase text-xs">Physical Specs</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-muted-foreground">Capacity</span>
                                            <span className="font-medium">{savedRoom.capacity} Students</span>
                                        </div>
                                        {Object.entries(savedRoom.physical_specs || {}).map(([key, val]) => val && (
                                            <div key={key} className="flex justify-between border-b pb-1">
                                                <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                                                <span className="font-medium">{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Equipment: Furniture */}
                                {savedRoom.equipment?.furniture && Object.values(savedRoom.equipment.furniture).some(v => v) && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-muted-foreground uppercase text-xs mt-4">Furniture</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(savedRoom.equipment.furniture).map(([key, val]) => val && (
                                                <div key={key} className="flex justify-between border-b pb-1">
                                                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ').replace('count', '')}</span>
                                                    <span className="font-medium">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Equipment: Technology */}
                                {savedRoom.equipment?.technology && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-muted-foreground uppercase text-xs mt-4">Technology</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(savedRoom.equipment.technology).map(([key, val]) => {
                                                if (!val) return null;
                                                if (typeof val === 'boolean') {
                                                    return <div key={key} className="col-span-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> <span className="capitalize">{key.replace('has_', '').replace(/_/g, ' ')}</span></div>;
                                                }
                                                return (
                                                    <div key={key} className="flex justify-between border-b pb-1">
                                                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ').replace('count', '')}</span>
                                                        <span className="font-medium">{val}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Equipment: Utilities */}
                                {savedRoom.equipment?.utilities && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-muted-foreground uppercase text-xs mt-4">Utilities</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(savedRoom.equipment.utilities).map(([key, val]) => {
                                                if (!val) return null;
                                                if (typeof val === 'boolean') {
                                                    return <div key={key} className="col-span-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> <span className="capitalize">{key.replace('has_', '').replace(/_/g, ' ')}</span></div>;
                                                }
                                                return (
                                                    <div key={key} className="flex justify-between border-b pb-1">
                                                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ').replace('count', '')}</span>
                                                        <span className="font-medium">{val}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Accessibility */}
                                {savedRoom.accessibility && Object.values(savedRoom.accessibility).some(v => v) && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-muted-foreground uppercase text-xs mt-4">Accessibility</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(savedRoom.accessibility).map(([key, val]) => {
                                                if (!val) return null;
                                                if (typeof val === 'boolean') {
                                                    return <span key={key} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100 capitalize">{key.replace(/_/g, ' ')}</span>;
                                                }
                                                return null;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Placeholder for User Requested Options */}
                        <Card className="border-blue-200 bg-blue-50/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-blue-800">Next Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    <Button variant="secondary" className="justify-start bg-white hover:bg-blue-100" onClick={onAddRoom}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Another Room
                                    </Button>

                                    <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="secondary" className="justify-start bg-white hover:bg-blue-100">
                                                <Plus className="mr-2 h-4 w-4" /> Book this Room
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl">
                                            <DialogHeader>
                                                <DialogTitle>Manage Bookings for {savedRoom.room_number}</DialogTitle>
                                            </DialogHeader>
                                            <div className="py-2">
                                                <RoomBookingManager roomId={roomId} />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                    {/* Additional options to be defined by user */}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">
                        {watch('room_number') ? `Room ${watch('room_number')}` : 'New Room'}
                    </h2>
                    <p className="text-sm text-muted-foreground">{watch('room_name') || 'Enter room details'}</p>
                </div>
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="overflow-x-auto shrink-0 pb-2">
                    <TabsList className="w-auto inline-flex justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
                        {['Identification', 'Physical Specs', 'Equipment & Furnishings', 'Accessibility', 'Maintenance', 'Booking & Allocation', 'Documentation'].map((tab, idx) => {
                            const val = tab.toLowerCase().split(' ')[0]; // simple slug
                            return (
                                <TabsTrigger
                                    key={val}
                                    value={val}
                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background"
                                >
                                    {idx + 1}. {tab}
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 mt-2 space-y-4">

                    {/* 1. Room Identification */}
                    <TabsContent value="identification" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Room Identification</CardTitle>
                                <CardDescription>Unique identifiers and classification.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Room ID (Auto-Generated)</label>
                                    <Input value={`BLD-01-FL-${watch('floor_number') || 'X'}-RM-${watch('room_number') || 'XXX'}`} disabled className="bg-muted font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Building Code</label>
                                    <Input disabled value="MAB (Inherited)" className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Room Number</label>
                                    <Input {...register('room_number', { required: true })} placeholder="101" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Floor Number</label>
                                    <Input type="number" {...register('floor_number')} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Room Name</label>
                                    <Input {...register('room_name')} placeholder="e.g. C.V. Raman Hall" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Room Type</label>
                                    <Select onValueChange={v => setValue('room_type', v)} value={watch('room_type')}>
                                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                            {['Classroom', 'Lab', 'Seminar Hall', 'Office', 'Auditorium', 'Canteen', 'Other'].map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Room Status</label>
                                    <Select onValueChange={v => setValue('status', v)} value={watch('status')}>
                                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                                        <SelectContent>
                                            {['Active', 'In Use', 'Closed', 'Under Renovation'].map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent >
                        </Card >
                    </TabsContent >

                    {/* 2. Physical Specifications */}
                    < TabsContent value="physical" className="mt-0" >
                        <Card>
                            <CardHeader>
                                <CardTitle>Physical Specifications</CardTitle>
                                <CardDescription>Structural details and finishings.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Carpet Area (sq ft)</label>
                                    <Input type="number" {...register('physical_specs.carpet_area')} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Built-up Area (sq ft)</label>
                                    <Input type="number" {...register('physical_specs.built_up_area')} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Room Height (ft)</label>
                                    <Input type="number" {...register('physical_specs.height')} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Capacity (Occupants)</label>
                                    <Input type="number" {...register('capacity')} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Window Area (sq ft)</label>
                                    <Input type="number" {...register('physical_specs.window_area')} placeholder="For natural light" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Flooring Type</label>
                                    <Select onValueChange={v => setValue('physical_specs.flooring', v)} value={watch('physical_specs.flooring')}>
                                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                            {['Tile', 'Marble', 'Concrete', 'Wooden', 'Carpet'].map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Wall Paint Condition</label>
                                    <Select onValueChange={v => setValue('physical_specs.paint_condition', v)} value={watch('physical_specs.paint_condition')}>
                                        <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                                        <SelectContent>
                                            {['Good', 'Fair', 'Poor'].map(c => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ceiling Type</label>
                                    <Select onValueChange={v => setValue('physical_specs.ceiling', v)} value={watch('physical_specs.ceiling')}>
                                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                            {['Concrete', 'Suspended', 'Wooden', 'POP'].map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent >

                    {/* 3. Equipment & Furnishings */}
                    < TabsContent value="equipment" className="mt-0 space-y-4" >

                        {/* 3a. Furniture */}
                        < Card >
                            <CardHeader className="pb-3 bg-muted/20">
                                <CardTitle className="text-base font-semibold">1. Furniture</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Desks/Tables (#)</label>
                                    <Input type="number" {...register('equipment.furniture.desks_count')} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Chairs (#)</label>
                                    <Input type="number" {...register('equipment.furniture.chairs_count')} />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs font-medium">Chair Type</label>
                                    <Input {...register('equipment.furniture.chair_type')} placeholder="e.g. Wooden with writing pad" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Cupboards (#)</label>
                                    <Input type="number" {...register('equipment.furniture.cupboards_count')} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Whiteboards (#)</label>
                                    <Input type="number" {...register('equipment.furniture.whiteboards_count')} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Notice Boards (#)</label>
                                    <Input type="number" {...register('equipment.furniture.noticeboards_count')} />
                                </div>
                            </CardContent>
                        </Card >

                        {/* 3b. Technology Equipment */}
                        < Card >
                            <CardHeader className="pb-3 bg-muted/20">
                                <CardTitle className="text-base font-semibold">2. Technology Equipment</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2 border p-3 rounded bg-card">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium">Projector</label>
                                            <Checkbox
                                                checked={watch('equipment.technology.has_projector')}
                                                onCheckedChange={c => setValue('equipment.technology.has_projector', c)}
                                            />
                                        </div>
                                        {watch('equipment.technology.has_projector') && (
                                            <Input className="h-8 mt-2" placeholder="Type (e.g. Epson 4K)" {...register('equipment.technology.projector_type')} />
                                        )}
                                    </div>
                                    <div className="space-y-2 border p-3 rounded bg-card">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium">Screen/Display</label>
                                            <Checkbox
                                                checked={watch('equipment.technology.has_screen')}
                                                onCheckedChange={c => setValue('equipment.technology.has_screen', c)}
                                            />
                                        </div>
                                        {watch('equipment.technology.has_screen') && (
                                            <Input className="h-8 mt-2" placeholder="Size (e.g. 100 inch)" {...register('equipment.technology.screen_size')} />
                                        )}
                                    </div>
                                    <div className="space-y-2 border p-3 rounded bg-card flex items-center justify-between">
                                        <label className="text-sm font-medium">Sound System</label>
                                        <Checkbox
                                            checked={watch('equipment.technology.has_sound')}
                                            onCheckedChange={c => setValue('equipment.technology.has_sound', c)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium">Computers (#)</label>
                                        <Input type="number" {...register('equipment.technology.computer_count')} />
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-xs font-medium">System Specs</label>
                                        <Input {...register('equipment.technology.computer_specs')} placeholder="i5, 16GB RAM..." />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium">Printers (#)</label>
                                        <Input type="number" {...register('equipment.technology.printer_count')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium">CCTV Cameras (#)</label>
                                        <Input type="number" {...register('equipment.technology.cctv_count')} />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-6">
                                        <Checkbox
                                            id="wifi"
                                            checked={watch('equipment.technology.has_wifi')}
                                            onCheckedChange={c => setValue('equipment.technology.has_wifi', c)}
                                        />
                                        <label htmlFor="wifi" className="text-sm font-medium">WiFi Access Point</label>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-6">
                                        <Checkbox
                                            id="doc_cam"
                                            checked={watch('equipment.technology.has_doc_camera')}
                                            onCheckedChange={c => setValue('equipment.technology.has_doc_camera', c)}
                                        />
                                        <label htmlFor="doc_cam" className="text-sm font-medium">Doc Camera</label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card >

                        {/* 3c. Utilities */}
                        < Card >
                            <CardHeader className="pb-3 bg-muted/20">
                                <CardTitle className="text-base font-semibold">3. Utilities in Room</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">AC Units (#)</label>
                                    <Input type="number" {...register('equipment.utilities.ac_count')} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Fans (#)</label>
                                    <Input type="number" {...register('equipment.utilities.fan_count')} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Lights (#)</label>
                                    <Input type="number" {...register('equipment.utilities.light_count')} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Light Type</label>
                                    <Select onValueChange={v => setValue('equipment.utilities.light_type', v)} value={watch('equipment.utilities.light_type')}>
                                        <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                            {['LED', 'CFL', 'Incandescent'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Power Outlets (#)</label>
                                    <Input type="number" {...register('equipment.utilities.outlet_count')} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Dustbins (#)</label>
                                    <Input type="number" {...register('equipment.utilities.dustbin_count')} />
                                </div>
                                <div className="flex items-center space-x-2 pt-6 col-span-2 text-blue-600">
                                    <Checkbox
                                        id="water"
                                        checked={watch('equipment.utilities.has_water')}
                                        onCheckedChange={c => setValue('equipment.utilities.has_water', c)}
                                    />
                                    <label htmlFor="water" className="text-sm font-medium cursor-pointer">Water Supply Available</label>
                                </div>
                            </CardContent>
                        </Card >

                        {/* 3d. Specialized */}
                        < Card >
                            <CardHeader className="pb-3 bg-muted/20">
                                <CardTitle className="text-base font-semibold">4. Specialized Equipment</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <SpecializedEquipmentManager
                                    roomId={roomId}
                                    equipmentList={equipmentList}
                                    onUpdate={fetchRoomDetails}
                                />
                            </CardContent>
                        </Card >
                    </TabsContent >

                    {/* 4. Accessibility Features */}
                    < TabsContent value="accessibility" className="mt-0" >
                        <Card>
                            <CardHeader>
                                <CardTitle>Accessibility Features (PWD - NAAC)</CardTitle>
                                <CardDescription>Compliance checklist for Persons with Disabilities.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between border p-3 rounded-md">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="wheelchair"
                                                checked={watch('accessibility.wheelchair')}
                                                onCheckedChange={(c) => setValue('accessibility.wheelchair', c)}
                                            />
                                            <label htmlFor="wheelchair" className="text-sm font-medium cursor-pointer">Wheelchair Accessible</label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border p-3 rounded-md">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="ramps"
                                                checked={watch('accessibility.ramps')}
                                                onCheckedChange={(c) => setValue('accessibility.ramps', c)}
                                            />
                                            <label htmlFor="ramps" className="text-sm font-medium cursor-pointer">Ramps in Room</label>
                                        </div>
                                    </div>

                                    <div className="border p-3 rounded-md space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="toilet"
                                                checked={watch('accessibility.accessible_toilet')}
                                                onCheckedChange={(c) => setValue('accessibility.accessible_toilet', c)}
                                            />
                                            <label htmlFor="toilet" className="text-sm font-medium cursor-pointer">accessible Toilet Nearby</label>
                                        </div>
                                        {watch('accessibility.accessible_toilet') && (
                                            <Input className="h-8" placeholder="Distance to toilet (meters)" {...register('accessibility.toilet_distance')} />
                                        )}
                                    </div>

                                    <div className="border p-3 rounded-md space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="parking"
                                                checked={watch('accessibility.accessible_parking')}
                                                onCheckedChange={(c) => setValue('accessibility.accessible_parking', c)}
                                            />
                                            <label htmlFor="parking" className="text-sm font-medium cursor-pointer">Accessible Parking</label>
                                        </div>
                                        {watch('accessibility.accessible_parking') && (
                                            <Input className="h-8" placeholder="Distance to parking (meters)" {...register('accessibility.parking_distance')} />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between border p-3 rounded-md">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="tactile"
                                                checked={watch('accessibility.tactile')}
                                                onCheckedChange={(c) => setValue('accessibility.tactile', c)}
                                            />
                                            <label htmlFor="tactile" className="text-sm font-medium cursor-pointer">Tactile Flooring</label>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between border p-3 rounded-md">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="braille"
                                                checked={watch('accessibility.braille')}
                                                onCheckedChange={(c) => setValue('accessibility.braille', c)}
                                            />
                                            <label htmlFor="braille" className="text-sm font-medium cursor-pointer">Braille Signage/Labels</label>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between border p-3 rounded-md">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="hearing"
                                                checked={watch('accessibility.hearing_loop')}
                                                onCheckedChange={(c) => setValue('accessibility.hearing_loop', c)}
                                            />
                                            <label htmlFor="hearing" className="text-sm font-medium cursor-pointer">Hearing Loop / Audio Systems</label>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent >

                    {/* 5. Maintenance Status */}
                    < TabsContent value="maintenance" className="mt-0" >
                        <Card>
                            <CardHeader>
                                <CardTitle>Maintenance Status</CardTitle>
                                <CardDescription>Cleanliness score and repair log.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cleanliness Score (1-10)</label>
                                        <div className="flex items-center gap-4">
                                            <Input type="range" min="1" max="10" className="flex-1" {...register('maintenance.cleanliness_score', { valueAsNumber: true })} />
                                            <span className="font-bold text-lg border p-2 rounded w-12 text-center">{watch('maintenance.cleanliness_score') || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Last Cleaning Date</label>
                                        <Input type="date" {...register('maintenance.last_cleaned')} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Last Maintenance Date</label>
                                        <Input type="date" {...register('maintenance.last_maintained')} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Next Scheduled Maintenance</label>
                                        <Input type="date" {...register('maintenance.next_schedule')} />
                                    </div>
                                    <div className="space-y-2 pt-6">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="repairs"
                                                checked={watch('maintenance.repairs_pending')}
                                                onCheckedChange={c => setValue('maintenance.repairs_pending', c)}
                                            />
                                            <label htmlFor="repairs" className="font-medium text-destructive cursor-pointer">Repairs Pending</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Maintenance Notes</label>
                                    <Textarea className="min-h-[100px]" {...register('maintenance.notes')} placeholder="Log any details..." />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent >

                    {/* 6. Booking & Allocation */}
                    < TabsContent value="booking" className="mt-0" >
                        <div className="space-y-4">
                            {/* Regular Allocation */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Regular Allocation</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Department Assigned</label>
                                        <Input {...register('allocation.dept_assigned')} placeholder="e.g. Computer Science" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Faculty In-Charge</label>
                                        <Input {...register('allocation.faculty')} placeholder="Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Academic Year</label>
                                        <Input {...register('allocation.academic_year')} placeholder="2025-2026" />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">Daily Schedule</label>
                                        <Textarea placeholder="9-10 AM: CSE A..." {...register('allocation.daily_schedule')} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Room Utilization */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Room Utilization Stats</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium">Sched. Hours/Week</label>
                                        <Input type="number" {...register('allocation.sched_hours')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium">Actual Used/Week</label>
                                        <Input type="number" {...register('allocation.used_hours')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium">Utilization Rate (%)</label>
                                        <Input type="number" readOnly className="bg-muted" value={75} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium">Idle Hours/Week</label>
                                        <Input type="number" {...register('allocation.idle_hours')} />
                                    </div>
                                </CardContent>
                            </Card>


                        </div>
                    </TabsContent >

                    {/* 7. Documentation */}
                    < TabsContent value="documentation" className="mt-0" >
                        <Card>
                            <CardHeader>
                                <CardTitle>Documentation</CardTitle>
                                <CardDescription>Blueprints, photos, and records.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DocumentManager roomId={roomId} />
                            </CardContent>
                        </Card>
                    </TabsContent >

                </div >
            </Tabs >
        </form>
    );
}
