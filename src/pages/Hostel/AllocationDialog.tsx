import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/services/api";
import { toast } from "sonner";
import { BedDouble } from "lucide-react";

interface AllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  hostels: any[];
  rooms: any[];
  beds: any[];
}

export function AllocationDialog({
  open,
  onOpenChange,
  onSuccess,
  hostels,
  rooms,
}: AllocationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedHostel, setSelectedHostel] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  useEffect(() => {
    if (open) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadData = async () => {
    try {
      // Fetch students
      const studentsRes = await api.getUsers({ role: "student" });
      if (studentsRes.data) {
        // Debug: Log first student to check ID format
        if (studentsRes.data.length > 0) {
          console.log(
            "First student ID:",
            studentsRes.data[0].id,
            "Type:",
            typeof studentsRes.data[0].id
          );
          console.log("First student user_id:", studentsRes.data[0].user_id);
        }
        setStudents(studentsRes.data);
      }

      // Fetch allocations to calculate available beds
      const allocationsRes = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/hostel/allocations`
      );
      const allocData = await allocationsRes.json();
      if (allocData.data) setAllocations(allocData.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  // Calculate available beds per room
  const getRoomOccupancy = (roomId: string) => {
    const room = rooms.find((r: any) => r.id === roomId);
    if (!room) return { total: 0, occupied: 0, available: 0 };

    const totalBeds = room.capacity || 0;
    const occupiedBeds = allocations.filter(
      (a: any) => a.room_id === roomId && a.status === "active"
    ).length;
    const availableBeds = totalBeds - occupiedBeds;

    return { total: totalBeds, occupied: occupiedBeds, available: availableBeds };
  };

  const filteredRooms = rooms?.filter((r: any) => r.hostel_id === selectedHostel) || [];

  // Only show rooms with available beds
  const availableRooms = filteredRooms.filter((r: any) => {
    const occupancy = getRoomOccupancy(r.id);
    return occupancy.available > 0;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent || !selectedRoom) {
      toast.error("Please select a student and room");
      return;
    }

    try {
      setLoading(true);

      // Debug: Log what we're about to send
      console.log("Submitting allocation with:", {
        user_id: selectedStudent,
        room_id: selectedRoom,
        hostel_id: selectedHostel,
      });

      // Create allocation using the hostel allocations endpoint
      // CRITICAL: Do NOT parseInt the selectedStudent - it's a UUID string!
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/hostel/allocations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: selectedStudent, // Keep as UUID string - DO NOT parse!
            room_id: selectedRoom, // UUID string
            hostel_id: selectedHostel, // UUID string
          }),
        }
      );

      const result = await response.json();
      console.log("Allocation result:", result);

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to allocate bed");
      }

      toast.success("Bed allocated successfully");
      onSuccess();
      onOpenChange(false);

      // Reset form
      setSelectedStudent("");
      setSelectedRoom("");
      setSelectedHostel("");
    } catch (error: any) {
      console.error("Allocation error:", error);
      toast.error(error.message || "Allocation failed");
    } finally {
      setLoading(false);
    }
  };

  const selectedRoomOccupancy = selectedRoom ? getRoomOccupancy(selectedRoom) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Allocate Hostel Bed</DialogTitle>
          <DialogDescription>
            Assign a student to an available bed in a hostel room
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Student *</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => {
                  // CRITICAL: Use UUID 'id' field, NOT integer 'user_id' field
                  // s.id should be UUID like "45206de5-616a-417f-9796-ebaf1f259447"
                  // s.user_id is integer like 1, 2, 3... (WRONG!)
                  const studentId = s.id; // This MUST be the UUID
                  return (
                    <SelectItem key={studentId} value={String(studentId)}>
                      {s.name} ({s.email})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Hostel *</Label>
            <Select
              value={selectedHostel}
              onValueChange={(val) => {
                setSelectedHostel(val);
                setSelectedRoom("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hostel" />
              </SelectTrigger>
              <SelectContent>
                {hostels?.map((h: any) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name} ({h.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Room *</Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom} disabled={!selectedHostel}>
              <SelectTrigger>
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.length === 0 ? (
                  <SelectItem value="none" disabled>
                    {selectedHostel ? "No rooms with available beds" : "Select a hostel first"}
                  </SelectItem>
                ) : (
                  availableRooms.map((r: any) => {
                    const occupancy = getRoomOccupancy(r.id);
                    return (
                      <SelectItem key={r.id} value={r.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>
                            Floor {r.floor_number} - Room {r.room_number}
                          </span>
                          <span className="ml-4 text-xs text-muted-foreground">
                            {occupancy.available}/{occupancy.total} beds available
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedRoomOccupancy && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
              <BedDouble className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {selectedRoomOccupancy.available} Bed
                  {selectedRoomOccupancy.available !== 1 ? "s" : ""} Available
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedRoomOccupancy.occupied} of {selectedRoomOccupancy.total} beds occupied
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedRoom || !selectedStudent}>
              {loading ? "Allocating..." : "Allocate Bed"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
