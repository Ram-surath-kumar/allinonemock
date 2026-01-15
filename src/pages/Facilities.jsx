import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FacilitiesTree } from '@/components/facilities/FacilitiesTree';
import RoomForm from '@/components/facilities/RoomForm';
import { LayoutDashboard, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Facilities() {
    const [hierarchy, setHierarchy] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch Hierarchy on Mount
    useEffect(() => {
        fetchHierarchy();
    }, []);

    const fetchHierarchy = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/facilities/hierarchy`);
            const result = await response.json();
            if (result.data) {
                setHierarchy(result.data);
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
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Facilities Management</h1>
                    <p className="text-muted-foreground">Manage buildings, rooms, equipment, and allocation.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchHierarchy}>Refresh</Button>
                    <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Building</Button>
                </div>
            </div>

            {/* Main Layout - 2 Columns */}
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

                {/* Right Content - Room Details */}
                <Card className="col-span-9 h-full overflow-hidden flex flex-col">
                    {selectedRoomId ? (
                        <div className="flex-1 overflow-y-auto p-6">
                            <RoomForm
                                roomId={selectedRoomId}
                                onSaved={() => {
                                    toast.success("Room updated");
                                    fetchHierarchy();
                                }}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10 select-none">
                            <LayoutDashboard className="h-16 w-16 mb-4 opacity-20" />
                            <h3 className="text-lg font-medium">Facilities Inventory System</h3>
                            <p className="text-sm max-w-sm text-center mt-2">
                                Select a room to view the <b>new 7-tab interface</b>:
                                <br />
                                (Identification, Specs, Equipment, Accessibility, Maintenance, Booking, Docs)
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
