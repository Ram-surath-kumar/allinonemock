// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/services/api";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface TimetableProps {
    initialExamId?: string;
    readOnly?: boolean;
}

export default function Timetable({ initialExamId, readOnly = false }: TimetableProps) {
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState<string>(initialExamId || "");
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    // @ts-ignore
    const [courses, setCourses] = useState<any[]>([]);

    // New Entry State
    const [newEntry, setNewEntry] = useState({
        subject: "",
        date: "",
        startTime: "",
        endTime: "",
        room: ""
    });

    useEffect(() => {
        loadExams();
        loadCourses();
    }, []);

    useEffect(() => {
        if (initialExamId) {
            setSelectedExam(initialExamId);
        }
    }, [initialExamId]);

    useEffect(() => {
        if (selectedExam) {
            loadTimetable(selectedExam);
        }
    }, [selectedExam]);

    const loadExams = async () => {
        try {
            const response = await api.getExams();
            if (response.data) {
                setExams(response.data);
                // Auto-select the first exam if none is selected
                if (!selectedExam && response.data.length > 0) {
                    setSelectedExam(response.data[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to load exams");
        }
    };

    const loadCourses = async () => {
        try {
            const response = await api.getCourses();
            if (response.data) setCourses(response.data);
        } catch (error) {
            console.error("Failed to load courses");
        }
    };

    const loadTimetable = async (examId: string) => {
        try {
            setLoading(true);
            const response = await api.getTimetable(examId);
            if (response.data) {
                setEntries(Array.isArray(response.data) ? response.data : []);
            } else {
                setEntries([]);
            }
        } catch (error) {
            console.error("Failed to load timetable", error);
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEntry = async () => {
        if (!selectedExam || !newEntry.subject || !newEntry.date) {
            toast.error("Please fill required fields");
            return;
        }

        try {
            // Find selected course name for toast/log (optional)
            // const course = courses.find(c => c.id === newEntry.subject);

            const payload = {
                exam_id: selectedExam,
                subject_id: newEntry.subject, // Now sending course ID (UUID)
                exam_date: newEntry.date,
                start_time: newEntry.startTime,
                end_time: newEntry.endTime,
                room_no: newEntry.room
            };

            const response = await api.createTimetableEntry(payload);
            if (response.error) throw new Error(response.error);

            toast.success("Entry added!");
            loadTimetable(selectedExam);
            setNewEntry({ subject: "", date: "", startTime: "", endTime: "", room: "" });
        } catch (error: any) {
            toast.error(error.message || "Failed to add entry");
        }
    };

    const getSubjectName = (id: string) => {
        const course = courses.find(c => c.id === id);
        if (course) return `${course.name} ${course.course_code ? `(${course.course_code})` : ''}`;
        // Fallback: Check if ID looks like a UUID
        if (id && id.length > 30) {
            // For now, if we can't find the course name, just show "Course Loaded..." or truncate
            // But better: show "Loading..." or "Unknown (ID: ...)" 
            // If courses array is empty (loading failed?), it might show UUID. 
            // Given the user wants it "mapped", if mapping fails, showing UUID is bad. 
            return "Subject Not Found";
        }
        return id;
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Exam Timetable</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                {/* Sidebar Selection */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Exam</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedExam} onValueChange={setSelectedExam}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Exam..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map(e => (
                                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {selectedExam && !readOnly && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Add Scheduled Exam</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Replaced Input with Select for Subject */}
                                <Select
                                    value={newEntry.subject}
                                    onValueChange={(val) => setNewEntry({ ...newEntry, subject: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Subject..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {courses.length > 0 ? (
                                            courses.map(course => (
                                                <SelectItem key={course.id} value={course.id}>
                                                    {course.name} {course.course_code ? `(${course.course_code})` : ''}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-sm text-muted-foreground">No subjects found</div>
                                        )}
                                    </SelectContent>
                                </Select>

                                <Input
                                    type="date"
                                    value={newEntry.date}
                                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        type="time"
                                        placeholder="Start"
                                        value={newEntry.startTime}
                                        onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                                    />
                                    <Input
                                        type="time"
                                        placeholder="End"
                                        value={newEntry.endTime}
                                        onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                                    />
                                </div>
                                <Input
                                    placeholder="Room No"
                                    value={newEntry.room}
                                    onChange={(e) => setNewEntry({ ...newEntry, room: e.target.value })}
                                />
                                <Button className="w-full" onClick={handleAddEntry}>
                                    <Plus className="mr-2 h-4 w-4" /> Add to Schedule
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Timetable Display */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : entries.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No entries found. Select an exam and add subjects.
                            </div>
                        ) : (
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 font-medium">
                                        <tr>
                                            <th className="p-3">Day</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Time</th>
                                            <th className="p-3">Subject</th>
                                            <th className="p-3">Room</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {entries.map((entry, idx) => {
                                            const date = new Date(entry.exam_date);
                                            const day = date.toLocaleDateString('en-US', { weekday: 'long' });
                                            return (
                                                <tr key={idx} className="hover:bg-muted/50">
                                                    <td className="p-3">{day}</td>
                                                    <td className="p-3">{entry.exam_date}</td>
                                                    <td className="p-3">{entry.start_time} - {entry.end_time}</td>
                                                    <td className="p-3 font-medium">
                                                        {getSubjectName(entry.subject_id)}
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">{entry.room_no}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
