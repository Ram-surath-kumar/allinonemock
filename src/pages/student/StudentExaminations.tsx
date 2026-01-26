import Timetable from "../Exam/Timetable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StudentExaminations() {
    return (
        <div className="space-y-6 pt-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Examinations
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View your exam schedules and results
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <Timetable readOnly={true} />
            </div>
        </div>
    );
}
