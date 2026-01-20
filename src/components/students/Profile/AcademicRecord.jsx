import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { Loader2, GraduationCap, TrendingUp, AlertCircle } from 'lucide-react';

export function AcademicRecord({ studentId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (studentId) loadHistory();
    }, [studentId]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const response = await api.getAcademicHistory(studentId);
            if (response.data) {
                setHistory(response.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate details from latest record or aggregate
    const latestRecord = history.length > 0 ? history[0] : null;
    const cgpa = latestRecord?.cgpa || 'N/A';
    const totalCredits = history.reduce((sum, rec) => sum + (rec.credits_earned || 0), 0);
    const standing = latestRecord?.standing || 'Good';

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cumulative GPA</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cgpa}</div>
                        <p className="text-xs text-muted-foreground">Current Academic Performance</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Credits Earned</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCredits}</div>
                        <p className="text-xs text-muted-foreground">Towards Graduation</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Academic Standing</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Badge variant={standing === 'Good' || standing === 'Dean List' ? 'default' : 'destructive'} className="text-lg">
                            {standing}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Semester History List */}
            <Card>
                <CardHeader>
                    <CardTitle>Semester History</CardTitle>
                    <CardDescription>Detailed academic performance per semester.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Semester</TableHead>
                                <TableHead>Academic Year</TableHead>
                                <TableHead>Credits Attempted</TableHead>
                                <TableHead>Credits Earned</TableHead>
                                <TableHead>SGPA</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No academic records found.</TableCell>
                                </TableRow>
                            ) : history.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell className="font-medium">{record.semesters?.name || 'Unknown'}</TableCell>
                                    <TableCell>{record.semesters?.academic_year}</TableCell>
                                    <TableCell>{record.credits_attempted}</TableCell>
                                    <TableCell>{record.credits_earned}</TableCell>
                                    <TableCell className="font-bold">{record.sgpa ?? 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{record.standing}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
