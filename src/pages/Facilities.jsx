import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FacilitiesTree } from '@/components/facilities/FacilitiesTree';
import RoomForm from '@/components/facilities/RoomForm';
import { FacilitiesDashboard } from '@/components/facilities/FacilitiesDashboard';
import { AddBuildingDialog } from '@/components/facilities/AddBuildingDialog';
import { AddRoomDialog } from '@/components/facilities/AddRoomDialog';
import { LayoutDashboard, Plus, Building, Bus } from 'lucide-react';
import { toast } from 'sonner';
import { VehicleInventory } from '@/components/facilities/VehicleInventory';

export default function Facilities() {
    const [view, setView] = useState('infrastructure'); // 'infrastructure' or 'vehicles'
    const [hierarchy, setHierarchy] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

    // Fetch Hierarchy on Mount
    useEffect(() => {
        fetchHierarchy();
    }, []);

    const fetchHierarchy = async (quiet = false) => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${baseUrl}/facilities/hierarchy`);
            const result = await response.json();
            if (result.data) {
                setHierarchy(result.data);
                if (!quiet && !loading) toast.info("Structure updated");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load facilities structure");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Facilities Management</h1>
                        <p className="text-muted-foreground text-sm">Manage buildings, rooms, vehicles, and allocation.</p>
                    </div>

                    <div className="flex bg-muted/50 p-1 rounded-lg border">
                        <Button
                            variant={view === 'infrastructure' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('infrastructure')}
                            className="rounded-md"
                        >
                            <Building className="h-4 w-4 mr-2" />
                            Infrastructure
                        </Button>
                        <Button
                            variant={view === 'vehicles' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('vehicles')}
                            className="rounded-md"
                        >
                            <Bus className="h-4 w-4 mr-2" />
                            Vehicles
                        </Button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchHierarchy(false)}>Refresh</Button>
                    {view === 'infrastructure' && (
                        <>
                            <Button size="sm" variant="secondary" onClick={() => setIsAddRoomOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Add Room
                            </Button>
                            <Button size="sm" onClick={() => setIsAddBuildingOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Add Building
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Logic */}
            {view === 'infrastructure' ? (
                <div className="grid grid-cols-12 gap-6 h-full min-h-0">
                    {/* Left Sidebar - Tree View */}
                    <Card className="col-span-3 h-full overflow-hidden flex flex-col">
                        <div className="p-4 border-b bg-muted/40">
                            <h3 className="font-semibold flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4" /> Structure
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            <FacilitiesTree
                                data={hierarchy}
                                onSelectRoom={setSelectedRoomId}
                                selectedRoomId={selectedRoomId}
                            />
                        </div>
                    </Card>

                    {/* Right Content - Room Details or Dashboard */}
                    <Card className="col-span-9 h-full overflow-hidden flex flex-col shadow-sm border-border/50">
                        {selectedRoomId ? (
                            <div className="flex-1 overflow-y-auto p-6">
                                <RoomForm
                                    roomId={selectedRoomId}
                                    onSaved={() => {
                                        toast.success("Room updated");
                                        fetchHierarchy(true);
                                    }}
                                    onAddRoom={() => setIsAddRoomOpen(true)}
                                />
                            </div>
                        ) : (
                            <FacilitiesDashboard hierarchy={hierarchy} />
                        )}
                    </Card>
                </div>
            ) : (
                <div className="flex-1 min-h-0">
                    <VehicleInventory />
                </div>
            )}

            <AddBuildingDialog
                open={isAddBuildingOpen}
                onOpenChange={setIsAddBuildingOpen}
                onSaved={() => fetchHierarchy(true)}
            />

            <AddRoomDialog
                open={isAddRoomOpen}
                onOpenChange={setIsAddRoomOpen}
                buildings={hierarchy}
                onSaved={() => fetchHierarchy(true)}
            />
        </div>
    );
}
