import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function RoomBookingManager({ roomId, onUpdate }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New Booking State
  const [newBooking, setNewBooking] = useState({
    event_name: "",
    organizer: "",
    date: new Date(),
    start_time: "09:00",
    end_time: "10:00",
    status: "Approved",
  });

  useEffect(() => {
    if (roomId) fetchBookings();
  }, [roomId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const response = await fetch(`${baseUrl}/facilities/bookings/${roomId}`);
      const result = await response.json();
      if (result.data) {
        setBookings(result.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBooking = async () => {
    try {
      setLoading(true);

      // Combine date and time
      const startDateTime = new Date(newBooking.date);
      const [startH, startM] = newBooking.start_time.split(":");
      startDateTime.setHours(parseInt(startH), parseInt(startM));

      const endDateTime = new Date(newBooking.date);
      const [endH, endM] = newBooking.end_time.split(":");
      endDateTime.setHours(parseInt(endH), parseInt(endM));

      const payload = {
        room_id: roomId,
        event_name: newBooking.event_name,
        organizer: newBooking.organizer,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: newBooking.status,
      };

      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const response = await fetch(`${baseUrl}/facilities/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed");

      toast.success("Booking created");
      setIsAddOpen(false);
      fetchBookings();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const response = await fetch(`${baseUrl}/facilities/bookings/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Booking cancelled");
        setBookings(bookings.filter((b) => b.id !== id));
        if (onUpdate) onUpdate();
      }
    } catch (e) {
      toast.error("Failed to cancel");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Scheduled Events</h3>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Book Room
        </Button>
      </div>

      <div className="space-y-2">
        {bookings.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-md text-muted-foreground text-sm">
            No upcoming bookings found.
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between p-3 border rounded-md bg-card"
            >
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  {booking.event_name}
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full border",
                      booking.status === "Approved"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : booking.status === "Pending"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {booking.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <CalendarIcon className="h-3 w-3" />
                  {format(new Date(booking.start_time), "MMM d, yyyy")}
                  <Clock className="h-3 w-3 ml-1" />
                  {format(new Date(booking.start_time), "h:mm a")} -{" "}
                  {format(new Date(booking.end_time), "h:mm a")}
                </div>
                <div className="text-xs text-muted-foreground">
                  by {booking.organizer || "Unknown"}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleDelete(booking.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input
                placeholder="e.g. Guest Lecture"
                value={newBooking.event_name}
                onChange={(e) => setNewBooking({ ...newBooking, event_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Organizer</Label>
              <Input
                placeholder="e.g. Dept of Physics"
                value={newBooking.organizer}
                onChange={(e) => setNewBooking({ ...newBooking, organizer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newBooking.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newBooking.date ? format(newBooking.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newBooking.date}
                    onSelect={(d) => d && setNewBooking({ ...newBooking, date: d })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newBooking.start_time}
                  onChange={(e) => setNewBooking({ ...newBooking, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newBooking.end_time}
                  onChange={(e) => setNewBooking({ ...newBooking, end_time: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBooking} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
