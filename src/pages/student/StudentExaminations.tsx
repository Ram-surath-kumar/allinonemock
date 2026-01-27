import { useState, useEffect } from "react";
import Timetable from "../Exam/Timetable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function StudentExaminations() {
    const { currentUser } = useAuth();
    const [marks, setMarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser?.id) {
            fetchMarks();
        }
    }, [currentUser?.id]);

    const fetchMarks = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/exam/marks/student/${currentUser?.id}`);
            if (response.data) {
                setMarks(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch marks:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pt-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Examination & Results
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View your schedules and evaluated results
                    </p>
                </div>
            </div>

            <Tabs defaultValue="schedule" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="schedule">Exam Schedules</TabsTrigger>
                    <TabsTrigger value="results">Evaluated Results</TabsTrigger>
                </TabsList>

                <TabsContent value="schedule" className="space-y-4">
                    <Timetable readOnly={true} />
                </TabsContent>

                <TabsContent value="results" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Results</CardTitle>
                            <CardDescription>
                                Evaluated marks for your completed examinations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Exam Name</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Score</TableHead>
                                            <TableHead>Remarks</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8">
                                                    Loading results...
                                                </TableCell>
                                            </TableRow>
                                        ) : marks.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No evaluated results found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            marks.map((mark, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">
                                                        {mark.exams?.name || "Unknown Exam"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {mark.exams?.start_date ? format(new Date(mark.exams.start_date), "PPP") : "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-bold text-lg">{mark.score}</span>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate" title={mark.remarks || ""}>
                                                        {mark.remarks || "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={mark.score >= 40 ? "default" : "destructive"}>
                                                            {mark.score >= 40 ? "Pass" : "Fail"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
