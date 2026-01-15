
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BookOpen, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

export function AcademicGovernance() {
    const [stats, setStats] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, programsRes] = await Promise.all([
                fetch('http://localhost:3001/api/academic/dashboard'),
                fetch('http://localhost:3001/api/academic/programs')
            ]);

            const statsJson = await statsRes.json();
            const programsJson = await programsRes.json();

            if (statsJson.data) setStats(statsJson.data);
            if (programsJson.data) setPrograms(programsJson.data);
        } catch (error) {
            console.error('Failed to fetch academic data', error);
        } finally {
            setLoading(false);
        }
    };

    const attainmentData = [
        { name: 'PO1', target: 75, achieved: 78 },
        { name: 'PO2', target: 75, achieved: 70 },
        { name: 'PO3', target: 70, achieved: 72 },
        { name: 'PO4', target: 75, achieved: 68 },
        { name: 'PO5', target: 65, achieved: 69 },
    ];

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Academic Governance</h1>
                <Button>New Program Proposal</Button>
            </div>

            {/* KPI Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.programs?.total || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.programs?.approved || 0} Approved, {stats?.programs?.pending || 0} Pending
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Curriculum Compliance</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.curriculumCompliance}%</div>
                        <p className="text-xs text-muted-foreground">
                            Adherence to UGC/AICTE norms
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg PO Attainment</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.avgPOAttainment}%</div>
                        <p className="text-xs text-muted-foreground">
                            Program Outcome Achievement
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Assessments</CardTitle>
                        <FileText className="h-4 w-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">
                            Ongoing exams & evaluations
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="programs" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="programs">Program Status</TabsTrigger>
                    <TabsTrigger value="outcomes">Outcome Analysis</TabsTrigger>
                    <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                </TabsList>

                <TabsContent value="programs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Academic Programs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="p-3 text-left">Program Code</th>
                                            <th className="p-3 text-left">Name</th>
                                            <th className="p-3 text-left">Duration</th>
                                            <th className="p-3 text-left">Status</th>
                                            <th className="p-3 text-left">Approval Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {programs.map((prog) => (
                                            <tr key={prog.id} className="border-t">
                                                <td className="p-3 font-medium">{prog.code}</td>
                                                <td className="p-3">{prog.name}</td>
                                                <td className="p-3">{prog.duration_years} Years</td>
                                                <td className="p-3">
                                                    <Badge variant={prog.approval_status === 'Approved' ? 'default' : 'secondary'}>
                                                        {prog.approval_status}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">{prog.approval_date}</td>
                                            </tr>
                                        ))}
                                        {programs.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-4 text-center text-muted-foreground">No programs found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="outcomes" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Program Outcome (PO) Attainment</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={attainmentData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="target" fill="#8884d8" name="Target Level" />
                                    <Bar dataKey="achieved" fill="#82ca9d" name="Achieved Level" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
