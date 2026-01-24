import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/services/api";
import { Users, AlertCircle } from "lucide-react";

export function SeatingArrangement({ exams }: { exams: any[] }) {
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [seatingPlan, setSeatingPlan] = useState<any[]>([]);

  // Demo data for Exam Center selection (would come from API in real app)
  const centers = [
    { id: "center_1", name: "Main Hall A", capacity: 40 },
    { id: "center_2", name: "Science Block B", capacity: 30 },
  ];
  const [selectedCenter, setSelectedCenter] = useState<string>(centers[0].id);

  useEffect(() => {
    if (selectedExam) {
      loadSeatingPlan();
    }
  }, [selectedExam]);

  const loadSeatingPlan = async () => {
    try {
      setLoading(true);
      const response = await api.getSeatingPlan(selectedExam);
      if (response.data) {
        setSeatingPlan(response.data);
      }
    } catch (error) {
      console.error("Failed to load seating plan", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedExam) {
      toast.error("Please select an exam first");
      return;
    }

    try {
      setLoading(true);
      const center = centers.find((c) => c.id === selectedCenter);

      const response = await api.generateSeatingPlan({
        exam_id: selectedExam,
        center_id: selectedCenter,
        room_capacity: center?.capacity || 30,
      });

      if (response.error) throw new Error(response.error);

      toast.success(`Seating generated! Used ${response.data.rooms_used} rooms.`);
      loadSeatingPlan();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate seating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-1/3 space-y-2">
          <label className="text-sm font-medium">Select Exam</label>
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an exam..." />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-1/3 space-y-2">
          <label className="text-sm font-medium">Select Center</label>
          <Select value={selectedCenter} onValueChange={setSelectedCenter}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a center..." />
            </SelectTrigger>
            <SelectContent>
              {centers.map((center) => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name} (Cap: {center.capacity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !selectedExam}
          className="shad-button-primary"
        >
          {loading ? "Processing..." : "Auto-Assign Seats"}
        </Button>
      </div>

      {/* Visual Grid */}
      <Card className="shad-card">
        <CardHeader>
          <CardTitle>Seating Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          {seatingPlan.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No seating plan generated yet.</p>
              <p className="text-xs">Select an exam and click "Auto-Assign" to generate.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {seatingPlan.map((seat, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 text-center bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="text-xs font-bold text-muted-foreground">
                    {seat.room_number} - {seat.seat_number}
                  </div>
                  <div className="mt-2 font-medium truncate" title={seat.student_id}>
                    Student ID: <br /> {seat.student_id?.substring(0, 8)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
