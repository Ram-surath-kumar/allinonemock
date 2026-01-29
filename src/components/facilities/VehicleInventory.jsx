import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Bus, Car, Truck, Info, ShieldCheck, Wrench, Navigation,
    Activity, Plus, Search, Filter, MoreHorizontal,
    Calendar, User, FileText, Smartphone, Settings,
    CheckCircle2, AlertCircle, Clock, MapPin, Gauge, Fuel,
    Briefcase, CreditCard, ClipboardCheck, Trash2, Edit3, Bookmark, StickyNote
} from 'lucide-react';
import { toast } from 'sonner';
import { AddVehicleDialog } from './AddVehicleDialog';
import { VehicleDetails } from './VehicleDetails';
import { RippleLoader } from "@/components/ui/RippleLoader";

export function VehicleInventory() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${baseUrl}/transport/vehicles`);
            const result = await response.json();
            if (result.data) {
                setVehicles(result.data);
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load vehicles");
        } finally {
            setLoading(false);
        }
    };

    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = (v.registration_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (v.vehicle_id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (v.make_model?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'all' || (v.vehicle_type?.toLowerCase() || '') === filterType.toLowerCase();
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'text-green-500 bg-green-500/10';
            case 'maintenance': return 'text-amber-500 bg-amber-500/10';
            case 'decommissioned': return 'text-red-500 bg-red-500/10';
            default: return 'text-slate-500 bg-slate-500/10';
        }
    };

    const getVehicleIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'bus': return <Bus className="h-5 w-5" />;
            case 'van': return <Car className="h-5 w-5" />;
            case 'tempo': return <Truck className="h-5 w-5" />;
            case 'car': return <Car className="h-5 w-5" />;
            default: return <Bus className="h-5 w-5" />;
        }
    };

    if (selectedVehicle) {
        return (
            <VehicleDetails
                vehicleId={selectedVehicle.id}
                onBack={() => {
                    setSelectedVehicle(null);
                    fetchVehicles();
                }}
            />
        );
    }

    return (
        <div className="flex-1 flex flex-col gap-6 p-4 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Vehicle Inventory</h2>
                    <p className="text-sm text-muted-foreground">Manage school fleet, maintenance and compliance.</p>
                </div>
                <Button onClick={() => setIsAddVehicleOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Vehicle
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by ID, Reg No or Model..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {['all', 'Bus', 'Van', 'Tempo', 'Car'].map((type) => (
                        <Button
                            key={type}
                            variant={filterType === type ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterType(type)}
                            className="capitalize"
                        >
                            {type}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <RippleLoader />
                    </div>
                ) : filteredVehicles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredVehicles.map((vehicle) => (
                            <Card
                                key={vehicle.id}
                                className="group cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all overflow-hidden border-border/50 bg-card"
                                onClick={() => setSelectedVehicle(vehicle)}
                            >
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-2 rounded-lg ${getStatusColor(vehicle.status)}`}>
                                            {getVehicleIcon(vehicle.vehicle_type)}
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(vehicle.status)}`}>
                                            {vehicle.status}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-lg">{vehicle.registration_number}</h3>
                                        <p className="text-xs text-muted-foreground font-medium uppercase">{vehicle.vehicle_id} • {vehicle.vehicle_type}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase">Make & Model</p>
                                            <p className="text-sm font-medium truncate">{vehicle.make_model || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[10px] text-muted-foreground uppercase">Capacity</p>
                                            <p className="text-sm font-medium">{vehicle.seating_capacity} Seats</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between border-t border-border/50">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            Exp: {vehicle.expiry_date ? new Date(vehicle.expiry_date).toLocaleDateString() : 'N/A'}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                <Bookmark className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Bus className="h-12 w-12 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">No Vehicles Found</h3>
                        <p className="text-sm">Try adjusting your search or add a new vehicle.</p>
                    </div>
                )}
            </div>

            <AddVehicleDialog
                open={isAddVehicleOpen}
                onOpenChange={setIsAddVehicleOpen}
                onSaved={() => {
                    fetchVehicles();
                }}
            />
        </div>
    );
}
