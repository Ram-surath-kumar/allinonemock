import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Users, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AssignStudentsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    examId?: string;
    examName?: string;
    onSuccess: () => void;
}

export function AssignStudentsDialog({
    open,
    onOpenChange,
    examId,
    examName,
    onSuccess,
}: AssignStudentsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [skipFee, setSkipFee] = useState(true);

    useEffect(() => {
        if (open) {
            loadStudents();
            setSelectedStudents([]);
            setSearchQuery("");
            setSkipFee(true);
        }
    }, [open]);

    const loadStudents = async () => {
        try {
            setLoadingStudents(true);
            const response = await api.getUsers({ role: "student", status: "active" });
            if (response.data) {
                setStudents(response.data);
            }
        } catch (error: any) {
            toast.error("Failed to load students");
        } finally {
            setLoadingStudents(false);
        }
    };

    const toggleStudent = (studentId: string) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudents.length === filteredStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map((s) => s.id));
        }
    };

    const handleSubmit = async () => {
        if (!examId || selectedStudents.length === 0) {
            toast.error("Please select at least one student");
            return;
        }

        setLoading(true);
        try {
            const response = await api.assignExamBulk({
                exam_id: examId,
                student_ids: selectedStudents,
                skip_fee: skipFee,
            });

            if (response.error) throw new Error(response.error);

            toast.success(`${selectedStudents.length} students assigned successfully`);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to assign students");
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.loopid && s.loopid.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Assign Students to Exam
                    </DialogTitle>
                    <DialogDescription>
                        Selected Exam: <span className="font-semibold text-foreground">{examName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col px-6 gap-4 mt-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search students by name or Loop ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={
                                    filteredStudents.length > 0 &&
                                    selectedStudents.length === filteredStudents.length
                                }
                                onCheckedChange={handleSelectAll}
                            />
                            <Label htmlFor="select-all" className="text-sm cursor-pointer">
                                Select All ({filteredStudents.length})
                            </Label>
                        </div>
                        <Badge variant="secondary">{selectedStudents.length} selected</Badge>
                    </div>

                    <ScrollArea className="flex-1 border rounded-md">
                        {loadingStudents ? (
                            <div className="flex items-center justify-center h-full py-10">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No students found.
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {filteredStudents.map((student) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                                        onClick={() => toggleStudent(student.id)}
                                    >
                                        <Checkbox
                                            checked={selectedStudents.includes(student.id)}
                                            onCheckedChange={() => toggleStudent(student.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-none truncate mb-1">
                                                {student.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {student.loopid || "No Loop ID"} • {student.email}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                        <Checkbox
                            checked={skipFee}
                            onCheckedChange={(val) => setSkipFee(!!val)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="skip-fee"
                                className="text-sm font-medium leading-none cursor-pointer"
                            >
                                Skip Fee Assignment
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Do not automatically assign an examination fee to these students.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 border-t mt-auto">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || selectedStudents.length === 0} className="shad-button-primary">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Assigning...
                            </>
                        ) : (
                            `Assign ${selectedStudents.length} Students`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
