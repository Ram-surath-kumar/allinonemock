import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface AddHostelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Room {
  floor_number: string;
  room_number: string;
  sharing_type: string;
  bed_count: string;
}

export function AddHostelDialog({ open, onOpenChange, onSuccess }: AddHostelDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Boys",
    address: "",
    contact_info: "",
    description: "",
  });

  const [rooms, setRooms] = useState<Room[]>([
    { floor_number: "", room_number: "", sharing_type: "3", bed_count: "3" },
  ]);

  const addRoom = () => {
    setRooms([...rooms, { floor_number: "", room_number: "", sharing_type: "3", bed_count: "3" }]);
  };

  const removeRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const updateRoom = (index: number, field: keyof Room, value: string) => {
    const newRooms = [...rooms];
    newRooms[index][field] = value;

    // Auto-update bed count based on sharing type
    if (field === "sharing_type") {
      newRooms[index].bed_count = value;
    }

    setRooms(newRooms);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please enter hostel name");
      return;
    }

    // Validate rooms
    const validRooms = rooms.filter((r) => r.floor_number && r.room_number);
    if (validRooms.length === 0) {
      toast.error("Please add at least one room");
      return;
    }

    try {
      setLoading(true);

      // Calculate total capacity from rooms
      const totalCapacity = validRooms.reduce((sum, room) => {
        return sum + parseInt(room.bed_count || "0");
      }, 0);

      // Auto-derive gender from hostel type to satisfy database constraint
      let gender = "Mixed"; // Default for Staff/Guest
      if (formData.type === "Boys") {
        gender = "Male";
      } else if (formData.type === "Girls") {
        gender = "Female";
      }

      const response = await api.createHostel({
        ...formData,
        gender, // Include gender derived from type
        capacity: totalCapacity,
        facilities: {},
        rooms: validRooms.map((room) => ({
          floor_number: parseInt(room.floor_number),
          room_number: room.room_number,
          sharing_type: room.sharing_type,
          bed_count: parseInt(room.bed_count),
        })),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success(`Hostel created successfully with ${validRooms.length} rooms`);
      onSuccess();
      onOpenChange(false);

      // Reset form
      setFormData({
        name: "",
        type: "Boys",
        address: "",
        contact_info: "",
        description: "",
      });
      setRooms([{ floor_number: "", room_number: "", sharing_type: "3", bed_count: "3" }]);
    } catch (error: any) {
      toast.error(error.message || "Failed to create hostel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Hostel</DialogTitle>
          <DialogDescription>
            Enter hostel details and configure rooms with floor numbers and bed sharing
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Details</TabsTrigger>
            <TabsTrigger value="rooms">Rooms & Beds</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Hostel Name *</Label>
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
                <Label htmlFor="type">Type *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Additional details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">Configure Rooms</h3>
                <p className="text-xs text-muted-foreground">Add rooms with floor, bed details</p>
              </div>
              <Button type="button" size="sm" onClick={addRoom} variant="outline">
                <Plus className="h-4 w-4 mr-1" /> Add Room
              </Button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {rooms.map((room, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Room {index + 1}</span>
                    {rooms.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRoom(index)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Floor Number *</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 1, 2, 3"
                        value={room.floor_number}
                        onChange={(e) => updateRoom(index, "floor_number", e.target.value)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Room Number *</Label>
                      <Input
                        placeholder="e.g., 101, 102"
                        value={room.room_number}
                        onChange={(e) => updateRoom(index, "room_number", e.target.value)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Sharing Type *</Label>
                      <Select
                        value={room.sharing_type}
                        onValueChange={(value) => updateRoom(index, "sharing_type", value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Single (1 Bed)</SelectItem>
                          <SelectItem value="2">Double (2 Beds)</SelectItem>
                          <SelectItem value="3">Triple (3 Beds)</SelectItem>
                          <SelectItem value="4">4-Sharing</SelectItem>
                          <SelectItem value="5">5-Sharing</SelectItem>
                          <SelectItem value="6">6-Sharing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Bed Count</Label>
                      <Input
                        type="number"
                        value={room.bed_count}
                        onChange={(e) => updateRoom(index, "bed_count", e.target.value)}
                        className="h-9 bg-muted"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/10 text-primary p-3 rounded-lg text-sm">
              <strong>Total Capacity:</strong>{" "}
              {rooms.reduce((sum, r) => sum + parseInt(r.bed_count || "0"), 0)} beds across{" "}
              {rooms.filter((r) => r.room_number).length} rooms
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Hostel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
