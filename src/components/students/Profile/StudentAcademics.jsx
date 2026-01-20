import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Plane, CalendarCheck } from 'lucide-react';
import { AcademicRecord } from './AcademicRecord';
import { GraduationAudit } from './GraduationAudit';
import { LeaveManagement } from './LeaveManagement';
import { CourseAttendance } from './CourseAttendance';

export function StudentAcademics({ userId }) {
    // userId is required for fetching specific student data
    if (!userId) return <div className="p-4 text-muted-foreground">Select a student to view academic details.</div>;

    return (
        <div className="space-y-6">
            <Tabs defaultValue="academic" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                    <TabsTrigger value="academic" className="py-3"><GraduationCap className="h-4 w-4 mr-2" /> Academic Record</TabsTrigger>
                    <TabsTrigger value="leaves" className="py-3"><Plane className="h-4 w-4 mr-2" /> Leaves</TabsTrigger>
                    <TabsTrigger value="attendance" className="py-3"><CalendarCheck className="h-4 w-4 mr-2" /> Attendance</TabsTrigger>
                </TabsList>

                <TabsContent value="academic" className="space-y-6">
                    <AcademicRecord studentId={userId} />
                    <GraduationAudit studentId={userId} />
                </TabsContent>

                <TabsContent value="leaves">
                    <LeaveManagement studentId={userId} />
                </TabsContent>

                <TabsContent value="attendance">
                    <CourseAttendance studentId={userId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
