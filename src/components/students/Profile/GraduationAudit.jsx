import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from '@/services/api';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, BookOpen } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function GraduationAudit({ studentId }) {
    const [audit, setAudit] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (studentId) loadAudit();
    }, [studentId]);

    const loadAudit = async () => {
        try {
            setLoading(true);
            const response = await api.getGraduationAudit(studentId);
            if (response.data) {
                setAudit(response.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    if (!audit || audit.message) return (
        <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Audit Not Available</AlertTitle>
            <AlertDescription>{audit?.message || "Could not retrieve graduation audit."}</AlertDescription>
        </Alert>
    );

    const { program, requirements, status, missing_core_courses } = audit;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">{program}</h3>
                    <p className="text-sm text-muted-foreground">Degree Audit & Progress</p>
                </div>
                {status.is_eligible ? (
                    <Badge className="bg-green-600 text-base py-1 px-3"><CheckCircle2 className="mr-2 h-4 w-4" /> Eligible for Graduation</Badge>
                ) : (
                    <Badge variant="outline" className="text-base py-1 px-3 text-orange-600 border-orange-200 bg-orange-50"><Loader2 className="mr-2 h-4 w-4" /> In Progress</Badge>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Credit Progress */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Credit Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-3xl font-bold">{status.credits_earned}</span>
                            <span className="text-sm text-muted-foreground mb-1">/ {requirements.total_credits} Required</span>
                        </div>
                        <Progress value={status.credits_progress} className="h-3" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {status.credits_earned >= requirements.total_credits ? "Requirement Met" : `${requirements.total_credits - status.credits_earned} credits remaining`}
                        </p>
                    </CardContent>
                </Card>

                {/* GPA Requirement */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">CGPA Requirement</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mb-2">
                            <span className={`text-3xl font-bold ${status.current_cgpa < requirements.min_cgpa ? 'text-destructive' : 'text-green-600'}`}>
                                {status.current_cgpa}
                            </span>
                            <span className="text-sm text-muted-foreground mb-1">/ {requirements.min_cgpa} Min</span>
                        </div>
                        <Progress
                            value={(status.current_cgpa / 10) * 100}
                            className="h-3 bg-muted"
                            indicatorClassName={status.current_cgpa < requirements.min_cgpa ? 'bg-destructive' : 'bg-green-600'}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            {status.current_cgpa >= requirements.min_cgpa ? "Requirement Met" : "Below Minimum CGPA"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Missing Core Courses */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Missing Core Requirements
                    </CardTitle>
                    <CardDescription>You must complete these mandatory courses to graduate.</CardDescription>
                </CardHeader>
                <CardContent>
                    {missing_core_courses.length === 0 ? (
                        <div className="flex items-center gap-2 text-green-600 py-4">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">All core course requirements met!</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {missing_core_courses.map((course, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <XCircle className="h-4 w-4 text-destructive" />
                                        <div>
                                            <p className="font-medium text-sm">{course.code}</p>
                                            <p className="text-xs text-muted-foreground">{course.name}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">{course.credits} Cr</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
