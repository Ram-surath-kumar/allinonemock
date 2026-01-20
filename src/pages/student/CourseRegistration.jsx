import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BookOpen, Clock, MapPin, User, CheckCircle2, History, AlertTriangle, Info, Search, Filter, Mail, Calendar, LayoutGrid, List
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export function CourseRegistration() {
    const { currentUser } = useAuth();
    const [offerings, setOfferings] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addDropPeriod, setAddDropPeriod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    useEffect(() => {
        if (currentUser?.id) {
            fetchData();
        }
    }, [currentUser]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [offRes, regRes, periodRes] = await Promise.all([
                fetch(`${API_URL}/course-registration/offerings`),
                fetch(`${API_URL}/course-registration/student/${currentUser.id}`),
                fetch(`${API_URL}/course-registration/periods`)
            ]);

            const offData = await offRes.json();
            const regData = await regRes.json();
            const periodData = await periodRes.json();

            if (offData.status === 'success') setOfferings(offData.data);
            if (regData.status === 'success') setRegistrations(regData.data);
            if (periodData.status === 'success' && periodData.data.length > 0) {
                setAddDropPeriod(periodData.data[0]);
            }
        } catch (error) {
            toast.error('Failed to sync registration data');
        } finally {
            setLoading(false);
        }
    };

    const isPeriodActive = () => {
        if (!addDropPeriod) return false;
        const now = new Date();
        const start = new Date(addDropPeriod.add_drop_start_date);
        const end = new Date(addDropPeriod.add_drop_end_date);
        return now >= start && now <= end;
    };

    const handleRegister = async (offeringId) => {
        try {
            const response = await fetch(`${API_URL}/course-registration/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: currentUser.id,
                    course_offering_id: offeringId
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                toast.success('Registration request processed');
                fetchData();
            } else {
                toast.error(data.error || 'Check prerequisite requirements');
            }
        } catch (error) {
            toast.error('Connection failure');
        }
    };

    const handleDrop = async (registrationId) => {
        try {
            const response = await fetch(`${API_URL}/course-registration/drop/${registrationId}`, {
                method: 'PATCH'
            });
            const data = await response.json();
            if (data.status === 'success') {
                toast.success('Course dropped successfully');
                fetchData();
            }
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const filteredOfferings = offerings.filter(off =>
        off.course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        off.course?.course_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const periodActive = isPeriodActive();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Academic Registration</h1>
                    <p className="text-muted-foreground text-sm">Plan your semester trajectory</p>
                </div>

                {addDropPeriod && (
                    <div className={cn(
                        "px-4 py-2 rounded-lg border flex items-center gap-3 transition-all",
                        periodActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                        <Clock size={16} className={periodActive ? "text-emerald-500" : "text-rose-500"} />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {periodActive ? 'Window Active' : 'Window Locked'}
                            </span>
                            <span className="text-xs font-semibold">Ends {new Date(addDropPeriod.add_drop_end_date).toLocaleDateString()}</span>
                        </div>
                    </div>
                )}
            </div>

            <Tabs defaultValue="available" className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[450px]">
                        <TabsTrigger value="available" className="flex items-center gap-2">
                            <BookOpen size={14} /> Catalog
                        </TabsTrigger>
                        <TabsTrigger value="registered" className="flex items-center gap-2">
                            <CheckCircle2 size={14} /> My Courses
                        </TabsTrigger>
                        <TabsTrigger value="trail" className="flex items-center gap-2">
                            <History size={14} /> History
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filters code, course..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <TabsContent value="available">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredOfferings.map((offering) => {
                            const isEnrolled = registrations.some(r => r.course_offering_id === offering.id && r.status === 'Registered');
                            return (
                                <Card key={offering.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <CardHeader className="p-6 pb-4">
                                        <div className="flex items-start justify-between">
                                            <Badge variant="secondary" className="mb-2">{offering.course?.course_code}</Badge>
                                            <Badge variant="outline" className="text-[10px] font-bold uppercase">{offering.course?.level}</Badge>
                                        </div>
                                        <CardTitle className="text-lg line-clamp-1">{offering.course?.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 pt-1 font-medium">
                                            <User size={12} /> {offering.faculty_name || 'Staff'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0 space-y-4">
                                        <div className="space-y-2 pt-2 text-sm text-muted-foreground border-t border-border/50">
                                            <div className="flex justify-between items-center font-medium">
                                                <div className="flex items-center gap-2"><Clock size={14} /> Slot</div>
                                                <span className="text-foreground">{offering.slot_code}</span>
                                            </div>
                                            <div className="flex justify-between items-center font-medium">
                                                <div className="flex items-center gap-2"><MapPin size={14} /> Room</div>
                                                <span className="text-foreground">{offering.room_number || 'TBD'}</span>
                                            </div>
                                            <div className="flex justify-between items-center font-medium">
                                                <div className="flex items-center gap-2"><Info size={14} /> Credits</div>
                                                <span className="text-primary font-bold">{offering.course?.credits} Units</span>
                                            </div>
                                        </div>

                                        <Button
                                            disabled={!periodActive || isEnrolled}
                                            className="w-full mt-4"
                                            variant={isEnrolled ? "outline" : "default"}
                                            onClick={() => handleRegister(offering.id)}
                                        >
                                            {isEnrolled ? (
                                                <div className="flex items-center gap-2"><CheckCircle2 size={14} /> Enrolled</div>
                                            ) : (
                                                periodActive ? 'Register Course' : 'Locked'
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="registered">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {registrations.filter(r => r.status === 'Registered').map((reg) => (
                            <Card key={reg.id} className="border-l-4 border-l-primary hover:shadow-md transition-all">
                                <CardHeader className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge className="font-bold">{reg.offering?.course?.course_code}</Badge>
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" title="Active Enrollment" />
                                    </div>
                                    <CardTitle className="text-xl">{reg.offering?.course?.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 font-medium">
                                        <MapPin size={14} /> {reg.offering?.room_number || 'Main Lab'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <div className="flex items-center justify-between mb-6 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-[10px] font-bold uppercase">Instructor</span>
                                            <span className="font-semibold">{reg.offering?.faculty_name || 'Staff'}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-muted-foreground text-[10px] font-bold uppercase">Schedule</span>
                                            <span className="font-semibold text-primary">{reg.offering?.slot_code}</span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        disabled={!periodActive}
                                        className="w-full group hover:border-destructive hover:bg-destructive/5 hover:text-destructive transition-all"
                                        onClick={() => handleDrop(reg.id)}
                                    >
                                        <span className="group-hover:hidden flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Active Registry</span>
                                        <span className="hidden group-hover:block">Terminate Enrollment</span>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="trail">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Instance</TableHead>
                                    <TableHead>Date Actioned</TableHead>
                                    <TableHead>Protocol</TableHead>
                                    <TableHead className="text-right">Outcome</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {registrations.map((reg) => (
                                    <TableRow key={reg.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm">{reg.offering?.course?.course_code}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium">{reg.offering?.course?.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">{new Date(reg.registration_date).toLocaleDateString()}</TableCell>
                                        <TableCell><Badge variant="outline" className="text-[10px] uppercase font-bold">Self Service</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className={cn("h-1.5 w-1.5 rounded-full", reg.status === 'Dropped' ? "bg-destructive" : "bg-emerald-500")} />
                                                <span className={cn("text-xs font-bold uppercase", reg.status === 'Dropped' ? "text-destructive" : "text-emerald-600")}>{reg.status}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
