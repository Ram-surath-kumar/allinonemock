import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/services/api";
import { Loader2, Save, User } from "lucide-react";

interface StudentGrade {
    id: string; // Student ID
    name: string;
    loopid?: string;
    score: string | number;
    remarks: string;
}

export default function Grading() {
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState<string>("");
    const [students, setStudents] = useState<StudentGrade[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadExams();
    }, []);

    useEffect(() => {
        if (selectedExam) {
            loadStudentsData(selectedExam);
        } else {
            setStudents([]);
        }
    }, [selectedExam]);

    const loadExams = async () => {
        try {
            const response = await api.getExams();
            if (response.data) {
                setExams(response.data);
            }
        } catch (error) {
            console.error("Failed to load exams", error);
        }
    };

    const loadStudentsData = async (examId: string) => {
        try {
            setLoading(true);
            const response = await api.get(`/exam/evaluation/${examId}`);
            if (response.data) {
                // Ensure we map the data correctly
                const mappedData = response.data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    loopid: item.loopid,
                    score: item.score ?? "",
                    remarks: item.remarks ?? ""
                }));
                setStudents(mappedData);
            }
        } catch (error) {
            console.error("Failed to load students", error);
            toast.error("Failed to load students for evaluation");
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (studentId: string, value: string) => {
        const numValue = parseFloat(value);
        if (value && (isNaN(numValue) || numValue < 0 || numValue > 100)) return;

        setStudents((prev) =>
            prev.map((s) => (s.id === studentId ? { ...s, score: value } : s))
        );
    };

    const handleRemarksChange = (studentId: string, value: string) => {
        setStudents((prev) =>
            prev.map((s) => (s.id === studentId ? { ...s, remarks: value } : s))
        );
    };

    const handleSubmit = async () => {
        if (!selectedExam) return;

        try {
            setSaving(true);

            // Filter out students with empty scores? Or submit all?
            // Submitting all allows clearing scores if needed, but usually we just submit valid ones.
            // Let's submit all where score is not empty string.
            const marksData = {
                exam_id: selectedExam,
                marks: students
                    .filter(s => s.score !== "")
                    .map((s) => ({
                        student_id: s.id,
                        score: Number(s.score),
                        remarks: s.remarks,
                    })),
            };

            if (marksData.marks.length === 0) {
                toast.warning("No marks to save.");
                setSaving(false);
                return;
            }

            const response = await api.post("/exam/marks/submit", marksData);

            if (response.error) throw new Error(response.error);

            toast.success("Grades submitted successfully");
            // Reload to ensure sync
            loadStudentsData(selectedExam);
        } catch (error: any) {
            toast.error(error.message || "Failed to submit grades");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 pt-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Evaluation & Grading</h2>
                    <p className="text-muted-foreground mt-1">
                        Enter marks and feedback for completed examinations.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedExam} onValueChange={setSelectedExam}>
                        <SelectTrigger className="w-[250px] bg-background">
                            <SelectValue placeholder="Select Examination..." />
                        </SelectTrigger>
                        <SelectContent>
                            {exams.length === 0 ? (
                                <SelectItem value="none" disabled>No exams available</SelectItem>
                            ) : (
                                exams.map((exam) => (
                                    <SelectItem key={exam.id} value={exam.id}>
                                        {exam.name}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-border/50 shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Student Marks Entry</CardTitle>
                            <CardDescription>
                                {selectedExam
                                    ? `Showing registered students for ${exams.find(e => e.id === selectedExam)?.name}`
                                    : "Select an exam to start grading"}
                            </CardDescription>
                        </div>
                        {selectedExam && (
                            <Button onClick={handleSubmit} disabled={saving || students.length === 0} className="gap-2">
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Save Changes
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {!selectedExam ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                            <div className="bg-muted p-4 rounded-full mb-4">
                                <User className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="font-medium">Please select an examination to view students.</p>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Loading student list...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground rounded-lg border border-dashed">
                            <p>No students registered for this exam yet.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                    <tr>
                                        <th className="p-4 w-[50px]">#</th>
                                        <th className="p-4">Student Name</th>
                                        <th className="p-4">ID / Roll No</th>
                                        <th className="p-4 w-[150px]">Score (0-100)</th>
                                        <th className="p-4">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y bg-card">
                                    {students.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-4 text-muted-foreground">{index + 1}</td>
                                            <td className="p-4 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    {student.name}
                                                </div>
                                            </td>
                                            <td className="p-4 text-muted-foreground font-mono text-xs">
                                                {student.loopid || student.id.substring(0, 8)}
                                            </td>
                                            <td className="p-4">
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        placeholder="-"
                                                        className={`w-24 font-mono select-all ${student.score !== "" && Number(student.score) < 35
                                                                ? "border-destructive text-destructive focus-visible:ring-destructive"
                                                                : ""
                                                            }`}
                                                        value={student.score}
                                                        onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Input
                                                    placeholder="Enter remarks..."
                                                    value={student.remarks}
                                                    onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                                    className="max-w-md"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
