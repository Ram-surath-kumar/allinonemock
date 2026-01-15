import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Loader2, BookOpen, AlertTriangle, User, Clock, MapPin, ShieldAlert, CheckCircle2 } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function CourseRegistration({ studentId, semesterId = "SEM-1" }) {
    const [offerings, setOfferings] = useState([]);
    const [registrations, setRegistrations] = useState([]); // [{ course_offering_id, type: 'credit', is_waiver_requested, waiver_reason }]
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [semesterId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await api.getCourseOfferings(semesterId);
            if (response.data) {
                setOfferings(response.data);
            }
        } catch (error) {
            toast.error("Failed to load course offerings");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (offeringId, checked) => {
        if (checked) {
            setRegistrations(prev => [...prev, {
                course_offering_id: offeringId,
                type: 'credit',
                is_waiver_requested: false,
                waiver_reason: ''
            }]);
        } else {
            setRegistrations(prev => prev.filter(r => r.course_offering_id !== offeringId));
        }
    };

    const updateRegistration = (offeringId, field, value) => {
        setRegistrations(prev => prev.map(r =>
            r.course_offering_id === offeringId ? { ...r, [field]: value } : r
        ));
    };

    const calculateCredits = () => {
        return registrations.reduce((sum, reg) => {
            if (reg.type === 'audit') return sum;
            const offering = offerings.find(o => o.id === reg.course_offering_id);
            return sum + (offering?.courses?.credits || 0);
        }, 0);
    };

    const totalCredits = calculateCredits();

    const [myRegistrations, setMyRegistrations] = useState([]);

    const handleRegister = async () => {
        if (totalCredits < 12) {
            toast.error("Minimum 12 credits required for full-time status.");
            return;
        }
        if (totalCredits > 25) {
            toast.error("Credit limit exceeded (Max 25).");
            return;
        }

        try {
            setSubmitting(true);
            const response = await api.registerCourses({
                student_id: studentId,
                semester_id: semesterId,
                registrations: registrations
            });

            if (!response.error) {
                toast.success(`Successfully registered for ${response.data.registered} courses!`);
                setRegistrations([]);
                loadData(); // Refresh to see updated enrolled counts if we were to show them
            } else {
                toast.error(response.error);
            }
        } catch (error) {
            toast.error("Registration failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Advanced Course Registration</h2>
                    <p className="text-muted-foreground">Semester 1 (Fall 2025) • Add/Drop Period Active</p>
                </div>
                <Card className="min-w-[200px]">
                    <CardContent className="p-4 flex items-center justify-between">
                        <span className="text-sm font-medium">Selected Credits</span>
                        <span className={`text-2xl font-bold ${totalCredits > 25 ? 'text-destructive' : 'text-primary'}`}>{totalCredits} <span className="text-sm text-muted-foreground">/ 25</span></span>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="register" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="register">Register Courses</TabsTrigger>
                    <TabsTrigger value="schedule">My Schedule & History</TabsTrigger>
                </TabsList>

                <TabsContent value="register" className="space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">Select</TableHead>
                                        <TableHead>Course</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>Logistics</TableHead>
                                        <TableHead>Options</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {offerings.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No courses available for this semester.</TableCell>
                                        </TableRow>
                                    ) : offerings.map(offering => {
                                        const isSelected = registrations.some(r => r.course_offering_id === offering.id);
                                        const isAlreadyRegistered = myRegistrations.some(r => r.course_offering_id === offering.id && r.status === 'registered');

                                        if (isAlreadyRegistered) return null; // Don't show already registered courses in selection list

                                        const currentReg = registrations.find(r => r.course_offering_id === offering.id);
                                        const isFull = offering.enrolled_count >= offering.capacity;
                                        const hasPrereqs = offering.courses.prerequisites?.length > 0;

                                        return (
                                            <TableRow key={offering.id} className={isSelected ? 'bg-muted/30' : ''}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) => handleSelect(offering.id, checked)}
                                                        disabled={isFull && !isSelected}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold">{offering.courses.course_code}</div>
                                                    <div className="text-sm">{offering.courses.name}</div>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">{offering.courses.type}</Badge>
                                                        {hasPrereqs && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <Badge variant="secondary" className="text-xs flex gap-1 items-center"><ShieldAlert className="h-3 w-3" /> Prereq</Badge>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p className="text-xs">
                                                                            Requires: {JSON.stringify(offering.courses.prerequisites)}
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm space-y-1">
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <BookOpen className="h-3 w-3" />
                                                            {offering.courses.credits} Credits
                                                        </div>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <User className="h-3 w-3" />
                                                            {offering.faculty_name || 'TBA'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm space-y-1">
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            {offering.slot_code || 'TBA'}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <MapPin className="h-3 w-3" />
                                                            {offering.room_number || 'TBA'}
                                                        </div>
                                                        <div className={`text-xs ${isFull ? 'text-destructive font-bold' : 'text-green-600'}`}>
                                                            {offering.enrolled_count} / {offering.capacity} Seats
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {isSelected && (
                                                        <div className="space-y-2 text-sm animate-in fade-in slide-in-from-top-1">
                                                            <div className="flex items-center gap-2">
                                                                <Label className="text-xs">Type:</Label>
                                                                <select
                                                                    className="text-xs border rounded p-1"
                                                                    value={currentReg?.type}
                                                                    onChange={(e) => updateRegistration(offering.id, 'type', e.target.value)}
                                                                >
                                                                    <option value="credit">Credit</option>
                                                                    <option value="audit">Audit</option>
                                                                </select>
                                                            </div>
                                                            {hasPrereqs && (
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <Checkbox
                                                                            id={`waiver-${offering.id}`}
                                                                            checked={currentReg?.is_waiver_requested}
                                                                            onCheckedChange={(c) => updateRegistration(offering.id, 'is_waiver_requested', c)}
                                                                        />
                                                                        <Label htmlFor={`waiver-${offering.id}`} className="text-xs text-orange-600">Request Waiver</Label>
                                                                    </div>
                                                                    {currentReg?.is_waiver_requested && (
                                                                        <Input
                                                                            placeholder="Reason for waiver..."
                                                                            className="h-6 text-xs"
                                                                            value={currentReg?.waiver_reason}
                                                                            onChange={(e) => updateRegistration(offering.id, 'waiver_reason', e.target.value)}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button size="lg" onClick={handleSubmit} disabled={submitting || registrations.length === 0}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Registration
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="schedule">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Class Schedule</CardTitle>
                            <CardDescription>Courses you are currently enrolled in.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Course</TableHead>
                                        <TableHead>Credits</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {myRegistrations.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Not enrolled in any courses.</TableCell></TableRow>
                                    ) : myRegistrations.map(reg => (
                                        <TableRow key={reg.id} className={reg.status === 'dropped' ? 'opacity-50 bg-muted/20' : ''}>
                                            <TableCell>
                                                <div className="font-semibold">{reg.courses?.course_code}</div>
                                                <div className="text-sm text-muted-foreground">{reg.courses?.name}</div>
                                            </TableCell>
                                            <TableCell>{reg.courses?.credits}</TableCell>
                                            <TableCell>
                                                <Badge variant={reg.status === 'registered' ? 'default' : 'secondary'}>
                                                    {reg.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{reg.registration_type}</TableCell>
                                            <TableCell>
                                                {reg.status === 'registered' && (
                                                    <Button variant="destructive" size="sm" onClick={() => handleDrop(reg.id, reg.courses?.course_code)}>
                                                        Drop
                                                    </Button>
                                                )}
                                                {reg.status === 'dropped' && (
                                                    <span className="text-xs text-muted-foreground">Dropped on {new Date(reg.dropped_at).toLocaleDateString()}</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

