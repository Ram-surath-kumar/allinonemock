import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FacilitiesTree } from "@/components/facilities/FacilitiesTree";
import RoomForm from "@/components/facilities/RoomForm";
import { FacilitiesDashboard } from "@/components/facilities/FacilitiesDashboard";
import { AddBuildingDialog } from "@/components/facilities/AddBuildingDialog";
import { AddRoomDialog } from "@/components/facilities/AddRoomDialog";
import { LayoutDashboard, Plus, Building, Bus } from "lucide-react";
import { toast } from "sonner";
import { VehicleInventory } from "@/components/facilities/VehicleInventory";

export default function Facilities() {
  const [view, setView] = useState("infrastructure"); // 'infrastructure' or 'vehicles'
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
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
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
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 animate-in fade-in duration-500">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Facilities Management</h1>
            <p className="text-muted-foreground text-sm">
              Manage buildings, rooms, vehicles, and allocation.
            </p>
          </div>

          <div className="flex bg-muted/50 p-1 rounded-lg border w-fit">
            <Button
              variant={view === "infrastructure" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("infrastructure")}
              className="rounded-md h-8"
            >
              <Building className="h-4 w-4 mr-2" />
              Infrastructure
            </Button>
            <Button
              variant={view === "vehicles" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("vehicles")}
              className="rounded-md h-8"
            >
              <Bus className="h-4 w-4 mr-2" />
              Vehicles
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchHierarchy(false)} className="h-8 flex-1 sm:flex-none">
            Refresh
          </Button>
          {view === "infrastructure" && (
            <>
              <Button size="sm" variant="secondary" onClick={() => setIsAddRoomOpen(true)} className="h-8 flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" /> Add Room
              </Button>
              <Button size="sm" onClick={() => setIsAddBuildingOpen(true)} className="h-8 flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" /> Add Building
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content Logic */}
      {view === "infrastructure" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          {/* Left Sidebar - Tree View */}
          <Card className="lg:col-span-3 flex flex-col border-border/50 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-4 border-b bg-muted/40">
              <h3 className="font-semibold flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> Structure
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
              <FacilitiesTree
                data={hierarchy}
                onSelectRoom={setSelectedRoomId}
                selectedRoomId={selectedRoomId}
              />
            </div>
          </Card>

          {/* Right Content - Room Details or Dashboard */}
          <Card className="lg:col-span-9 flex flex-col shadow-md border-border/50 overflow-hidden min-h-[500px]">
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
        <Card className="flex-1 shadow-sm border-border/50 flex flex-col min-h-0">
          <VehicleInventory />
        </Card>
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
