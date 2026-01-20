import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/services/api";
import { fetchDepartments } from "@/services/departments";
import { toast } from "sonner";

interface ScheduleExamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ScheduleExamDialog({ open, onOpenChange, onSuccess }: ScheduleExamDialogProps) {
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        academic_year: "2024-2025",
        term: "Spring",
        type: "Mid-Term",
        start_date: "",
        end_date: "",
    });

    useEffect(() => {
        if (open) {
            loadDepartments();
            // Reset form when dialog opens
            setFormData({
                name: "",
                academic_year: "2024-2025",
                term: "Spring",
                type: "Mid-Term",
                start_date: "",
                end_date: "",
            });
            setSelectedDepartments([]);
        }
    }, [open]);

    const loadDepartments = async () => {
        try {
            setLoadingDepartments(true);
            const data = await fetchDepartments();
            setDepartments(data || []);
        } catch (error: any) {
            console.error('Error loading departments:', error);
            toast.error('Failed to load departments');
        } finally {
            setLoadingDepartments(false);
        }
    };

    const toggleDepartment = (departmentId: string) => {
        setSelectedDepartments(prev => 
            prev.includes(departmentId)
                ? prev.filter(id => id !== departmentId)
                : [...prev, departmentId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create Academic Calendar Entry (Simplified: assuming manual for now, or auto-create)
            // Ideally backend handles this. For MVP, we just create the Exam directly 
            // but we need IDs. Let's fake them or rely on Backend defaults?
            // "programs" and "semesters" need to be arrays.

            if (selectedDepartments.length === 0) {
                toast.error("Please select at least one department");
                setLoading(false);
                return;
            }

            const payload = {
                name: formData.name,
                start_date: formData.start_date,
                end_date: formData.end_date,
                departments: selectedDepartments,
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

                    <div className="space-y-2">
                        <Label>Departments</Label>
                        <div className={`rounded-lg border p-4 max-h-48 overflow-y-auto ${
                            selectedDepartments.length === 0 ? 'border-destructive' : 'border-border'
                        }`}>
                            {loadingDepartments ? (
                                <p className="text-sm text-muted-foreground">Loading departments...</p>
                            ) : departments.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No departments available</p>
                            ) : (
                                <div className="space-y-2">
                                    {departments.map((dept) => (
                                        <div key={dept.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`dept-${dept.id}`}
                                                checked={selectedDepartments.includes(dept.id)}
                                                onCheckedChange={() => toggleDepartment(dept.id)}
                                            />
                                            <Label
                                                htmlFor={`dept-${dept.id}`}
                                                className="text-sm font-medium cursor-pointer flex-1"
                                            >
                                                {dept.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedDepartments.length === 0 && (
                            <p className="text-sm text-destructive">Please select at least one department</p>
                        )}
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
