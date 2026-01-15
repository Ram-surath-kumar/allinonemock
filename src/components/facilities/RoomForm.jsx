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

export default function RoomForm({ roomId, onSaved }) {
    const [loading, setLoading] = useState(false);
    const [equipmentList, setEquipmentList] = useState([]); // For specialized items array
    const [activeTab, setActiveTab] = useState("identification");

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
        }
    }, [roomId]);

    const fetchRoomDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/facilities/rooms/${roomId}`);
            const result = await response.json();

            if (result.data) {
                const room = result.data;
                // Defensively merge with defaults to avoid uncontrolled input errors
                reset({
                    ...room,
                    physical_specs: room.physical_specs || {},
                    equipment: room.equipment_json || { furniture: {}, technology: {}, utilities: {}, specialized: [] },
                    accessibility: room.accessibility || {},
                    maintenance: room.maintenance || { cleanliness_score: 5 },
                    allocation: room.allocation || {}
                });
                setEquipmentList(room.equipment || []); // Uses distinct table if implemented, or fallback
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
                // Save the categorized equipment state into the JSONB 'equipment_json' column (proposed)
                // or 'physical_specs' if we reuse that. We will use a generic approach here.
                // Assuming backend expects these keys in the body to merge into JSONB columns.
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/facilities/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.data) {
                toast.success("Room saved successfully");
                if (onSaved) onSaved(result.data);
            } else {
                toast.error("Failed to save room");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

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
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 2. Physical Specifications */}
                    <TabsContent value="physical" className="mt-0">
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
                    </TabsContent>

                    {/* 3. Equipment & Furnishings */}
                    <TabsContent value="equipment" className="mt-0 space-y-4">

                        {/* 3a. Furniture */}
                        <Card>
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
                        </Card>

                        {/* 3b. Technology Equipment */}
                        <Card>
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
                        </Card>

                        {/* 3c. Utilities */}
                        <Card>
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
                        </Card>

                        {/* 3d. Specialized */}
                        <Card>
                            <CardHeader className="pb-3 bg-muted/20 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-semibold">4. Specialized Equipment</CardTitle>
                                <Button size="sm" variant="ghost" onClick={() => toast.info('Coming soon')}><Plus className="h-4 w-4 mr-2" />Add Item</Button>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="text-sm text-center text-muted-foreground border border-dashed py-4 rounded">
                                    Usage: Log specific items like Microscopes, Spectrometers, etc.
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 4. Accessibility Features */}
                    <TabsContent value="accessibility" className="mt-0">
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
                    </TabsContent>

                    {/* 5. Maintenance Status */}
                    <TabsContent value="maintenance" className="mt-0">
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
                    </TabsContent>

                    {/* 6. Booking & Allocation */}
                    <TabsContent value="booking" className="mt-0">
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

                            {/* Bookings for Special Events */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bookings for Special Events</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center p-4 border rounded border-dashed text-muted-foreground">
                                        Calendar Integration Coming Soon
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* 7. Documentation */}
                    <TabsContent value="documentation" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Documentation</CardTitle>
                                <CardDescription>Blueprints, photos, and records.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button variant="outline" className="h-20 flex flex-col gap-1 border-dashed">
                                    <Plus className="h-4 w-4" />
                                    <span>Upload Room Layout/Blueprint</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex flex-col gap-1 border-dashed">
                                    <Plus className="h-4 w-4" />
                                    <span>Upload Equipment Photos</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex flex-col gap-1 border-dashed">
                                    <Plus className="h-4 w-4" />
                                    <span>Upload Condition Photos</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex flex-col gap-1 border-dashed">
                                    <Plus className="h-4 w-4" />
                                    <span>Upload Safety Certificate</span>
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </div>
            </Tabs>
        </form>
    );
}
