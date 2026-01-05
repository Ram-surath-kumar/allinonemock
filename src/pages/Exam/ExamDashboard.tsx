import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar, GraduationCap, FileCheck, Plus, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { ScheduleExamDialog } from './ScheduleExamDialog';
import { SeatingArrangement } from './SeatingArrangement';
import { HallTicketGenerator } from './HallTicketGenerator';

export default function ExamDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({});
    const [exams, setExams] = useState<any[]>([]);
    const [scheduleOpen, setScheduleOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response = await api.getExamDashboard();
            if (response.error) throw new Error(response.error);
            setStats(response.data || {});

            const examsResponse = await api.getExams();
            if (examsResponse.data) setExams(examsResponse.data);

        } catch (error: any) {
            toast.error(error.message || 'Failed to load exam data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading examination data...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Examinations</h1>
                    <p className="text-muted-foreground mt-1">Manage schedules, assessments, and results</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData}>Refresh</Button>
                    <Button className="shad-button-primary" onClick={() => setScheduleOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Schedule Exam
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shad-card hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active_exams?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Currently scheduled</p>
                    </CardContent>
                </Card>

                <Card className="shad-card hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                        <BookOpen className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_exams || 0}</div>
                        <p className="text-xs text-muted-foreground">This academic year</p>
                    </CardContent>
                </Card>

                <Card className="shad-card hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Results Pending</CardTitle>
                        <FileCheck className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending_results || 0}</div>
                        <p className="text-xs text-muted-foreground">Approvals needed</p>
                    </CardContent>
                </Card>

                <Card className="shad-card hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Pass Rate</CardTitle>
                        <GraduationCap className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--%</div>
                        <p className="text-xs text-muted-foreground">Across all courses</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="planning" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="planning">Planning</TabsTrigger>
                    <TabsTrigger value="administration">Administration</TabsTrigger>
                    <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                    <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>

                <TabsContent value="planning" className="space-y-4">
                    <Card className="shad-card">
                        <CardHeader>
                            <CardTitle>Upcoming Examinations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {exams.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No exams scheduled. Click "Schedule Exam" to create one.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {exams.map((exam: any) => (
                                        <div key={exam.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-lg">{exam.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-1 rounded-full ${exam.status === 'PLANNED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {exam.status}
                                                </span>
                                                <Button variant="outline" size="sm">Timetable</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="administration">
                    <Tabs defaultValue="seating" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="seating">Seating Arrangement</TabsTrigger>
                            <TabsTrigger value="tickets">Hall Tickets</TabsTrigger>
                        </TabsList>

                        <TabsContent value="seating">
                            <SeatingArrangement exams={exams} />
                        </TabsContent>

                        <TabsContent value="tickets">
                            <HallTicketGenerator exams={exams} />
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                <TabsContent value="evaluation">
                    <Card className="shad-card">
                        <CardHeader><CardTitle>Marks Entry</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Select a course to enter marks.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="results">
                    <Card className="shad-card">
                        <CardHeader><CardTitle>Published Results</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Access result analytics and reports.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ScheduleExamDialog
                open={scheduleOpen}
                onOpenChange={setScheduleOpen}
                onSuccess={loadData}
            />
        </div>
    );
}
