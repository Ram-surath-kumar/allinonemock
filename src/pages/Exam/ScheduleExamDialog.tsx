import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/services/api";
import { toast } from "sonner";

interface ScheduleExamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ScheduleExamDialog({ open, onOpenChange, onSuccess }: ScheduleExamDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        academic_year: "2024-2025",
        term: "Spring",
        type: "Mid-Term",
        start_date: "",
        end_date: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create Academic Calendar Entry (Simplified: assuming manual for now, or auto-create)
            // Ideally backend handles this. For MVP, we just create the Exam directly 
            // but we need IDs. Let's fake them or rely on Backend defaults?
            // "programs" and "semesters" need to be arrays.

            const payload = {
                name: formData.name,
                start_date: formData.start_date,
                end_date: formData.end_date,
                programs: ["B.Tech", "MBA"], // Demo: All programs
                semesters: [1, 2, 3, 4, 5, 6, 7, 8], // Demo: All semesters
                status: "PLANNED"
            };

            const response = await api.createExam(payload);

            if (response.error) {
                throw new Error(response.error);
            }

            toast.success("Exam scheduled successfully!");
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to schedule exam");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Schedule New Examination</DialogTitle>
                    <DialogDescription>
                        Create a new exam event. This will initialize the timetable planning.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Exam Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Spring 2024 Mid-Term"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Exam Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Mid-Term">Mid-Term</SelectItem>
                                    <SelectItem value="Final">Final</SelectItem>
                                    <SelectItem value="Quiz">Quiz</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="term">Term</Label>
                            <Select
                                value={formData.term}
                                onValueChange={(val) => setFormData({ ...formData, term: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select term" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Fall">Fall</SelectItem>
                                    <SelectItem value="Spring">Spring</SelectItem>
                                    <SelectItem value="Summer">Summer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">End Date</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="shad-button-primary" disabled={loading}>
                            {loading ? "Scheduling..." : "Schedule Exam"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
