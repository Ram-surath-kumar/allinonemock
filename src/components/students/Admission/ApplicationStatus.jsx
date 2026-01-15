import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export function ApplicationStatus({ application }) {
    const getStatusStep = (status) => {
        switch (status) {
            case 'applied': return 1;
            case 'verified': return 2;
            case 'shortlisted': return 3;
            case 'merit_listed': return 4;
            case 'admitted': return 5;
            default: return 0;
        }
    };

    const step = getStatusStep(application.status);
    const progress = (step / 5) * 100;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base">{application.course_applied}</CardTitle>
                        <p className="text-xs text-muted-foreground font-mono mt-1">{application.application_no}</p>
                    </div>
                    <Badge variant={
                        application.status === 'admitted' ? 'success' :
                            application.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                        {application.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Application Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${step >= 1 ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className={step >= 1 ? 'font-medium' : 'text-muted-foreground'}>Application Submitted</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${step >= 2 ? 'border-green-500 bg-green-500 text-white' : 'border-muted-foreground'}`}>
                            {step >= 2 && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                        <span className={step >= 2 ? 'font-medium' : 'text-muted-foreground'}>Documents Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${step >= 4 ? 'border-green-500 bg-green-500 text-white' : 'border-muted-foreground'}`}>
                            {step >= 4 && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                        <span className={step >= 4 ? 'font-medium' : 'text-muted-foreground'}>Merit List Selection</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${step >= 5 ? 'border-green-500 bg-green-500 text-white' : 'border-muted-foreground'}`}>
                            {step >= 5 && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                        <span className={step >= 5 ? 'font-medium' : 'text-muted-foreground'}>Enrollment Confirmed</span>
                    </div>
                </div>

                {application.remarks && (
                    <div className="text-sm bg-yellow-50 text-yellow-800 p-3 rounded-md border border-yellow-100">
                        <p className="font-semibold text-xs mb-1">Admin Remarks:</p>
                        {application.remarks}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
