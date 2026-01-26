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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/services/api";
import { Loader2 } from "lucide-react";

export default function Grading() {
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState<string>("");
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [grades, setGrades] = useState<Record<string, number>>({});

    useEffect(() => {
        loadExams();
    }, []);

    useEffect(() => {
        if (selectedExam) {
            loadStudents(selectedExam);
        }
    }, [selectedExam]);

    const loadExams = async () => {
        try {
            // Fetch exams (you might need to add a method to fetch exams if getExams isn't enough)
            const response = await api.getExams();
            if (response.data) {
                setExams(response.data);
            }
        } catch (error) {
            console.error("Failed to load exams", error);
        }
    };

    const loadStudents = async (examId: string) => {
        try {
            setLoading(true);
            // In a real app, you might fetch students registered for this exam
            // For now, we'll fetch all students or use a mock endpoint if specific one needed
            // Assuming getStudents works or we use a fallback
            // Ideally implementation: api.getExamStudents(examId)

            // Let's use getStudents for now as a base
            const response = await api.getStudents();
            if (response.data) {
                setStudents(response.data);
                // Initialize grades if existing
                // const gradesResponse = await api.getExamGrades(examId);
            }
        } catch (error) {
            console.error("Failed to load students", error);
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const handleGradeChange = (studentId: string, value: string) => {
        setGrades((prev) => ({
            ...prev,
            [studentId]: parseFloat(value),
        }));
    };

    const handleSubmit = async () => {
        if (!selectedExam) return;

        try {
            setSaving(true);
            const marksData = {
                exam_id: selectedExam,
                marks: Object.entries(grades).map(([student_id, score]) => ({
                    student_id,
                    score,
                })),
            };

            const response = await api.submitMarks(marksData);
            if (response.error) throw new Error(response.error);

            toast.success("Grades submitted successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to submit grades");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Student Grading</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Exam</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedExam} onValueChange={setSelectedExam}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Choose an exam to grade..." />
                        </SelectTrigger>
                        <SelectContent>
                            {exams.map((exam) => (
                                <SelectItem key={exam.id} value={exam.id}>
                                    {exam.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedExam && (
                <Card>
                    <CardHeader>
                        <CardTitle>Enter Grades</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border rounded-md">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                                            <tr>
                                                <th className="p-4">Student Name</th>
                                                <th className="p-4">ID</th>
                                                <th className="p-4">Grade / Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {students.map((student) => (
                                                <tr key={student.id} className="hover:bg-muted/50">
                                                    <td className="p-4 font-medium">{student.name}</td>
                                                    <td className="p-4 text-muted-foreground">{student.loopid || student.id.substring(0, 8)}</td>
                                                    <td className="p-4">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            placeholder="0-100"
                                                            className="w-24"
                                                            value={grades[student.id] || ""}
                                                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {students.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No students found for this exam context.
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSubmit} disabled={saving || students.length === 0}>
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Submit Grades"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
