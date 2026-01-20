import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from 'sonner';
import { CheckCircle2, Clock, XCircle, FileText, IndianRupee, GraduationCap, Award, Building2, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

export function AdmissionPortal() {
    const [admissions, setAdmissions] = useState([]);
    const [stats, setStats] = useState({ total: 0, status: {}, courses: {} });
    const [loading, setLoading] = useState(false);
    const [isApplyOpen, setIsApplyOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);

    // Initial Form State
    const [formData, setFormData] = useState({
        applicant_name: '',
        email: '',
        phone: '',
        course_applied: '',
        dob: '',
        entrance_exam_details: {
            exam_name: '',
            marks: '',
            total_marks: '',
            rank: ''
        },
        academic_qualifications: {
            tenth_marks: '',
            tenth_board: '',
            twelfth_marks: '',
            twelfth_board: ''
        },
        // UGC/AICTE Fields
        study_mode: 'Regular',
        gender: '',
        category: 'General',
        bpl_status: false,
        minority_status: false,
        minority_type: '',
        pwd_status: false,
        first_graduate_status: false,
        nationality_type: 'Indian'
    });

    useEffect(() => {
        fetchAdmissions();
        fetchStats();
    }, []);

    const fetchAdmissions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/sim/admissions`);
            const result = await response.json();
            if (result.status === 'success') {
                setAdmissions(result.data || []);
            }
        } catch (error) {
            toast.error('Failed to load admissions');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/sim/admissions/stats`);
            const result = await response.json();
            if (result.status === 'success') setStats(result.data);
        } catch (error) {
            console.error('Failed to load stats');
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/sim/admissions/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.status === 'success') {
                toast.success(`Application submitted! ID: ${result.data.application_no}`);
                setIsApplyOpen(false);
                fetchAdmissions();
                fetchStats();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast.error('Application failed');
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/sim/admissions/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                toast.success(`Status updated to ${newStatus}`);
                fetchAdmissions();
                fetchStats();
                if (selectedApp?.id === id) {
                    setSelectedApp(prev => ({ ...prev, status: newStatus }));
                }
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            toast.error('Update failed');
        }
    };

    // Generic update for nested details
    const updateDetails = async (id, details) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/sim/admissions/${id}/details`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(details)
            });

            if (response.ok) {
                toast.success(`Details updated`);
                fetchAdmissions();
                // Update local state if selected
                if (selectedApp?.id === id) {
                    setSelectedApp(prev => ({ ...prev, ...details }));
                }
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            toast.error('Update failed');
        }
    };


    const getStatusColor = (status) => {
        switch (status) {
            case 'admitted': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'offered': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'shortlisted': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const REQUIRED_DOCS = [
        '10th Certificate', '12th Certificate', 'Caste Certificate',
        'Income Certificate', 'EWS Certificate', 'PWD Certificate',
        'Character Certificate'
    ];

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Admission Management</h2>
                    <p className="text-muted-foreground">Manage entire admission lifecycle from application to enrollment.</p>
                </div>

                <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2"><FileText className="h-4 w-4" /> New Application</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>New Student Application</DialogTitle></DialogHeader>
                        <form onSubmit={handleApply} className="space-y-6 mt-4">
                            {/* Personal Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Personal Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Full Name</label>
                                        <Input value={formData.applicant_name} onChange={e => setFormData({ ...formData, applicant_name: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">DOB</label>
                                        <DatePicker
                                            date={formData.dob}
                                            setDate={(date) => setFormData({ ...formData, dob: date })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Email</label>
                                        <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Phone</label>
                                        <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                                    </div>
                                </div>
                            </div>

                            {/* UGC / AICTE Categories */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Category & Social Status</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Gender</label>
                                        <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Transgender">Transgender</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Category</label>
                                        <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="General">General</SelectItem>
                                                <SelectItem value="OBC">OBC</SelectItem>
                                                <SelectItem value="SC">SC</SelectItem>
                                                <SelectItem value="ST">ST</SelectItem>
                                                <SelectItem value="EWS">EWS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Study Mode</label>
                                        <Select value={formData.study_mode} onValueChange={v => setFormData({ ...formData, study_mode: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Regular">Regular (Full-time)</SelectItem>
                                                <SelectItem value="Part-Time">Part-Time</SelectItem>
                                                <SelectItem value="Distance">Distance Learning</SelectItem>
                                                <SelectItem value="Sponsored">Sponsored</SelectItem>
                                                <SelectItem value="Research">Research Scholar</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Nationality Type</label>
                                        <Select value={formData.nationality_type} onValueChange={v => setFormData({ ...formData, nationality_type: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Indian">Indian National</SelectItem>
                                                <SelectItem value="NRI">NRI</SelectItem>
                                                <SelectItem value="OCI">OCI</SelectItem>
                                                <SelectItem value="Foreign">Foreign National</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" className="h-4 w-4" checked={formData.bpl_status} onChange={e => setFormData({ ...formData, bpl_status: e.target.checked })} />
                                        <label className="text-sm">Below Poverty Line (BPL)</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" className="h-4 w-4" checked={formData.pwd_status} onChange={e => setFormData({ ...formData, pwd_status: e.target.checked })} />
                                        <label className="text-sm">Person w/ Disability (PWD)</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" className="h-4 w-4" checked={formData.minority_status} onChange={e => setFormData({ ...formData, minority_status: e.target.checked })} />
                                        <label className="text-sm">Minority Comunity</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" className="h-4 w-4" checked={formData.first_graduate_status} onChange={e => setFormData({ ...formData, first_graduate_status: e.target.checked })} />
                                        <label className="text-sm">First Graduate</label>
                                    </div>
                                    {formData.minority_status && (
                                        <div>
                                            <Select value={formData.minority_type} onValueChange={v => setFormData({ ...formData, minority_type: v })}>
                                                <SelectTrigger className="h-8"><SelectValue placeholder="Select Religion" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Muslim">Muslim</SelectItem>
                                                    <SelectItem value="Christian">Christian</SelectItem>
                                                    <SelectItem value="Sikh">Sikh</SelectItem>
                                                    <SelectItem value="Buddhist">Buddhist</SelectItem>
                                                    <SelectItem value="Jain">Jain</SelectItem>
                                                    <SelectItem value="Parsi">Parsi</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Course Selection */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Program Selection</h3>
                                <div>
                                    <label className="text-sm font-medium">Course Applying For</label>
                                    <Select onValueChange={v => setFormData({ ...formData, course_applied: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="B.Tech Computer Science">B.Tech Computer Science</SelectItem>
                                            <SelectItem value="B.Tech Electronics">B.Tech Electronics</SelectItem>
                                            <SelectItem value="B.Tech Mechanical">B.Tech Mechanical</SelectItem>
                                            <SelectItem value="BBA">BBA</SelectItem>
                                            <SelectItem value="MBA">MBA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Entrance Exam */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Entrance Exam</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Exam Name</label>
                                        <Input placeholder="JEE / CAT / GATE" value={formData.entrance_exam_details.exam_name} onChange={e => setFormData({ ...formData, entrance_exam_details: { ...formData.entrance_exam_details, exam_name: e.target.value } })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Rank / Percentile</label>
                                        <Input placeholder="AIR 1234" value={formData.entrance_exam_details.rank} onChange={e => setFormData({ ...formData, entrance_exam_details: { ...formData.entrance_exam_details, rank: e.target.value } })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Marks Obtained</label>
                                        <Input type="number" value={formData.entrance_exam_details.marks} onChange={e => setFormData({ ...formData, entrance_exam_details: { ...formData.entrance_exam_details, marks: e.target.value } })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Total Marks</label>
                                        <Input type="number" value={formData.entrance_exam_details.total_marks} onChange={e => setFormData({ ...formData, entrance_exam_details: { ...formData.entrance_exam_details, total_marks: e.target.value } })} />
                                    </div>
                                </div>
                            </div>

                            {/* Academic Qualifications */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Qualifications</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">12th Marks (%)</label>
                                        <Input type="number" value={formData.academic_qualifications.twelfth_marks} onChange={e => setFormData({ ...formData, academic_qualifications: { ...formData.academic_qualifications, twelfth_marks: e.target.value } })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">12th Board</label>
                                        <Input value={formData.academic_qualifications.twelfth_board} onChange={e => setFormData({ ...formData, academic_qualifications: { ...formData.academic_qualifications, twelfth_board: e.target.value } })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">10th Marks (%)</label>
                                        <Input type="number" value={formData.academic_qualifications.tenth_marks} onChange={e => setFormData({ ...formData, academic_qualifications: { ...formData.academic_qualifications, tenth_marks: e.target.value } })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">10th Board</label>
                                        <Input value={formData.academic_qualifications.tenth_board} onChange={e => setFormData({ ...formData, academic_qualifications: { ...formData.academic_qualifications, tenth_board: e.target.value } })} />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" size="lg">Submit Application</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.status['applied'] || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Shortlisted/Offered</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{(stats.status['offered'] || 0) + (stats.status['shortlisted'] || 0)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Admitted (Pending)</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.status['admitted'] || 0}</div></CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Application List */}
                <Card className="lg:col-span-1 border-muted">
                    <CardHeader><CardTitle>Applications</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[600px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Applicant</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {admissions.map(app => (
                                        <TableRow key={app.id}
                                            className={`cursor-pointer ${selectedApp?.id === app.id ? 'bg-muted' : ''}`}
                                            onClick={() => setSelectedApp(app)}
                                        >
                                            <TableCell>
                                                <div className="font-medium">{app.applicant_name}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <span className="font-mono">{app.application_no}</span>
                                                    <span>•</span>
                                                    <span>{app.course_applied}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className={`${getStatusColor(app.status)} text-[10px]`}>
                                                    {app.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {admissions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No applications found</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Right: Detail View */}
                <div className="lg:col-span-2">
                    {selectedApp ? (
                        <Card className="h-fit sticky top-6">
                            <CardHeader className="border-b bg-muted/20 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-xl">{selectedApp.applicant_name}</CardTitle>
                                            <Badge className={getStatusColor(selectedApp.status)}>{selectedApp.status.toUpperCase()}</Badge>
                                        </div>
                                        <CardDescription>{selectedApp.application_no} • applied on {new Date(selectedApp.created_at).toLocaleDateString()}</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant={selectedApp.status === 'applied' ? 'secondary' : 'outline'} onClick={() => updateStatus(selectedApp.id, 'applied')}>Applied</Button>
                                        <Button size="sm" variant={selectedApp.status === 'shortlisted' ? 'secondary' : 'outline'} onClick={() => updateStatus(selectedApp.id, 'shortlisted')}>Shortlist</Button>
                                        <Button size="sm" variant={selectedApp.status === 'offered' ? 'secondary' : 'outline'} onClick={() => updateStatus(selectedApp.id, 'offered')}>Offer</Button>
                                        <Button size="sm" variant={selectedApp.status === 'admitted' ? 'default' : 'outline'} onClick={() => updateStatus(selectedApp.id, 'admitted')}>Admit</Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Tabs defaultValue="overview" className="w-full">
                                    <TabsList className="w-full justify-start rounded-none border-b h-12">
                                        <TabsTrigger value="overview">Overview</TabsTrigger>
                                        <TabsTrigger value="merit_offer">Merit & Offer</TabsTrigger>
                                        <TabsTrigger value="verification">Verification & Fees</TabsTrigger>
                                        <TabsTrigger value="enrollment" disabled={selectedApp.status !== 'admitted'}>Enrollment</TabsTrigger>
                                    </TabsList>

                                    {/* 1. Overview Tab */}
                                    <TabsContent value="overview" className="p-4 space-y-6">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/10 p-4 rounded-lg">
                                                <div><span className="text-muted-foreground block text-xs uppercase">Email</span> <span className="font-medium">{selectedApp.email}</span></div>
                                                <div><span className="text-muted-foreground block text-xs uppercase">Phone</span> <span className="font-medium">{selectedApp.phone || '-'}</span></div>
                                                <div><span className="text-muted-foreground block text-xs uppercase">DOB</span> <span className="font-medium">{selectedApp.dob || '-'}</span></div>
                                                <div><span className="text-muted-foreground block text-xs uppercase">Course</span> <span className="font-medium text-primary">{selectedApp.course_applied}</span></div>
                                            </div>

                                            {/* UGC details */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm p-4 border rounded-lg">
                                                <div><span className="text-muted-foreground block text-xs uppercase">Category</span> <span className="font-medium">{selectedApp.category || 'General'}</span></div>
                                                <div><span className="text-muted-foreground block text-xs uppercase">Gender</span> <span className="font-medium">{selectedApp.gender || '-'}</span></div>
                                                <div><span className="text-muted-foreground block text-xs uppercase">Mode</span> <span className="font-medium">{selectedApp.study_mode || 'Regular'}</span></div>
                                                <div>
                                                    <span className="text-muted-foreground block text-xs uppercase">Status</span>
                                                    <div className="flex gap-1 mt-1">
                                                        {selectedApp.is_bpl && <Badge variant="outline" className="text-[10px] px-1 h-5 text-orange-600 border-orange-200">BPL</Badge>}
                                                        {selectedApp.is_pwd && <Badge variant="outline" className="text-[10px] px-1 h-5 text-blue-600 border-blue-200">PWD</Badge>}
                                                        {selectedApp.is_minority && <Badge variant="outline" className="text-[10px] px-1 h-5 text-green-600 border-green-200">{selectedApp.minority_type || 'Minority'}</Badge>}
                                                        {!selectedApp.is_bpl && !selectedApp.is_pwd && !selectedApp.is_minority && <span className="font-medium">-</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="border rounded-lg p-3 space-y-2">
                                                    <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground"><FileText className="h-4 w-4" /> Entrance Exam</h4>
                                                    <div className="text-sm grid grid-cols-2 gap-y-1">
                                                        <span className="text-muted-foreground">Exam Name</span> <span className="font-medium text-right">{selectedApp.entrance_exam_details?.exam_name || '-'}</span>
                                                        <span className="text-muted-foreground">Rank</span> <span className="font-medium text-right">{selectedApp.entrance_exam_details?.rank || '-'}</span>
                                                        <span className="text-muted-foreground">Score</span> <span className="font-medium text-right">{selectedApp.entrance_exam_details?.marks} / {selectedApp.entrance_exam_details?.total_marks}</span>
                                                    </div>
                                                </div>

                                                <div className="border rounded-lg p-3 space-y-2">
                                                    <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground"><GraduationCap className="h-4 w-4" /> Academics</h4>
                                                    <div className="text-sm grid grid-cols-2 gap-y-1">
                                                        <span className="text-muted-foreground">12th Grade</span> <span className="font-medium text-right">{selectedApp.academic_qualifications?.twelfth_marks}%</span>
                                                        <span className="text-muted-foreground">12th Board</span> <span className="font-medium text-right">{selectedApp.academic_qualifications?.twelfth_board}</span>
                                                        <span className="text-muted-foreground">10th Grade</span> <span className="font-medium text-right">{selectedApp.academic_qualifications?.tenth_marks}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* 2. Merit & Offer Tab */}
                                    <TabsContent value="merit_offer" className="p-4 space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Phase 1: Merit List */}
                                            <div className="space-y-4">
                                                <div><h4 className="font-semibold flex items-center gap-2"><Award className="h-4 w-4 text-purple-600" /> Merit & Placement</h4></div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground">Merit Rank (All India)</label>
                                                        <Input
                                                            value={selectedApp.merit_details?.merit_rank || ''}
                                                            onChange={(e) => updateDetails(selectedApp.id, { merit_details: { ...selectedApp.merit_details, merit_rank: e.target.value } })}
                                                            placeholder="e.g. 1024"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground">Category Rank</label>
                                                        <Input
                                                            value={selectedApp.merit_details?.category_rank || ''}
                                                            onChange={(e) => updateDetails(selectedApp.id, { merit_details: { ...selectedApp.merit_details, category_rank: e.target.value } })}
                                                            placeholder="e.g. OBC-120"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground">Placement Status</label>
                                                        <Select
                                                            value={selectedApp.merit_details?.placement_status || 'Waitlist'}
                                                            onValueChange={(v) => updateDetails(selectedApp.id, { merit_details: { ...selectedApp.merit_details, placement_status: v } })}
                                                        >
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Selected">Selected</SelectItem>
                                                                <SelectItem value="Waitlist">Waitlist</SelectItem>
                                                                <SelectItem value="Rejected">Rejected</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground">Merit List Document (Link)</label>
                                                        <Input
                                                            value={selectedApp.merit_details?.document_link || ''}
                                                            onChange={(e) => updateDetails(selectedApp.id, { merit_details: { ...selectedApp.merit_details, document_link: e.target.value } })}
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Phase 2: Offer Letter */}
                                            <div className="space-y-4">
                                                <div><h4 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" /> Offer Details</h4></div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground">Offer Date</label>
                                                        <DatePicker
                                                            date={selectedApp.offer_details?.offer_date}
                                                            setDate={(d) => updateDetails(selectedApp.id, { offer_details: { ...selectedApp.offer_details, offer_date: d } })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground">Offer Validity (Expiry)</label>
                                                        <DatePicker
                                                            date={selectedApp.offer_details?.expiry_date}
                                                            setDate={(d) => updateDetails(selectedApp.id, { offer_details: { ...selectedApp.offer_details, expiry_date: d } })}
                                                        />
                                                    </div>
                                                    <div className="pt-2">
                                                        <div className="flex items-center justify-between border p-3 rounded-md bg-muted/20">
                                                            <span className="text-sm font-medium">Offer Accepted?</span>
                                                            <Button
                                                                size="sm"
                                                                variant={selectedApp.offer_details?.accepted ? "default" : "outline"}
                                                                onClick={() => updateDetails(selectedApp.id, { offer_details: { ...selectedApp.offer_details, accepted: !selectedApp.offer_details?.accepted, acceptance_date: new Date().toISOString() } })}
                                                            >
                                                                {selectedApp.offer_details?.accepted ? "Yes, Accepted" : "No, Pending"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground">Offer Letter (Link)</label>
                                                        <Input
                                                            value={selectedApp.offer_details?.document_link || ''}
                                                            onChange={(e) => updateDetails(selectedApp.id, { offer_details: { ...selectedApp.offer_details, document_link: e.target.value } })}
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* 3. Verification & Fees Tab */}
                                    <TabsContent value="verification" className="p-4 space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Document Verification */}
                                            <div>
                                                <h4 className="font-semibold mb-3 flex items-center gap-2"><UserCheck className="h-4 w-4 text-orange-600" /> Document Verification</h4>
                                                <ScrollArea className="h-[300px] border rounded-md p-2">
                                                    <div className="space-y-2">
                                                        {REQUIRED_DOCS.map(doc => {
                                                            const status = selectedApp.document_verification_status?.[doc] || 'Pending';
                                                            return (
                                                                <div key={doc} className="flex items-center justify-between p-2 border-b last:border-0">
                                                                    <span className="text-sm">{doc}</span>
                                                                    <div className="flex gap-1">
                                                                        <Button size="icon" variant={status === 'Verified' ? 'default' : 'ghost'} className={`h-6 w-6 ${status === 'Verified' ? 'bg-green-600 hover:bg-green-700' : ''}`} onClick={() => updateDetails(selectedApp.id, { document_verification_status: { ...selectedApp.document_verification_status, [doc]: 'Verified' } })}>
                                                                            <CheckCircle2 className="h-3 w-3" />
                                                                        </Button>
                                                                        <Button size="icon" variant={status === 'Rejected' ? 'destructive' : 'ghost'} className="h-6 w-6" onClick={() => updateDetails(selectedApp.id, { document_verification_status: { ...selectedApp.document_verification_status, [doc]: 'Rejected' } })}>
                                                                            <XCircle className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </ScrollArea>
                                            </div>

                                            {/* Fee Payment */}
                                            <div className="space-y-4">
                                                <h4 className="font-semibold flex items-center gap-2"><IndianRupee className="h-4 w-4 text-green-600" /> Fee Payment</h4>
                                                <Card className="bg-muted/10">
                                                    <CardContent className="p-4 space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-xs font-medium text-muted-foreground">Amount Due</label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedApp.fee_payment_details?.amount_due || ''}
                                                                    onChange={(e) => updateDetails(selectedApp.id, { fee_payment_details: { ...selectedApp.fee_payment_details, amount_due: e.target.value } })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                                                                <DatePicker
                                                                    date={selectedApp.fee_payment_details?.due_date}
                                                                    setDate={(d) => updateDetails(selectedApp.id, { fee_payment_details: { ...selectedApp.fee_payment_details, due_date: d } })}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-xs font-medium text-muted-foreground">Amount Paid</label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedApp.fee_payment_details?.amount_paid || ''}
                                                                    onChange={(e) => updateDetails(selectedApp.id, { fee_payment_details: { ...selectedApp.fee_payment_details, amount_paid: e.target.value } })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-medium text-muted-foreground">Payment Date</label>
                                                                <DatePicker
                                                                    date={selectedApp.fee_payment_details?.payment_date}
                                                                    setDate={(d) => updateDetails(selectedApp.id, { fee_payment_details: { ...selectedApp.fee_payment_details, payment_date: d } })}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-2">
                                                            <span className="text-sm font-medium">Status</span>
                                                            <Select
                                                                value={selectedApp.fee_payment_details?.status || 'Pending'}
                                                                onValueChange={(v) => updateDetails(selectedApp.id, { fee_payment_details: { ...selectedApp.fee_payment_details, status: v } })}
                                                            >
                                                                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Pending">Pending</SelectItem>
                                                                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                                                                    <SelectItem value="Paid">Fully Paid</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-muted-foreground">Payment Receipt (Link)</label>
                                                            <Input
                                                                value={selectedApp.fee_payment_details?.receipt_url || ''}
                                                                onChange={(e) => updateDetails(selectedApp.id, { fee_payment_details: { ...selectedApp.fee_payment_details, receipt_url: e.target.value } })}
                                                                placeholder="https://..."
                                                            />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* 4. Enrollment Tab */}
                                    <TabsContent value="enrollment" className="p-4 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-600" /> Enrollment Details</h4>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700">Admitted Student</Badge>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <h5 className="text-sm font-medium border-b pb-1">Program Allocation</h5>
                                                    <div className="grid gap-3">
                                                        <div>
                                                            <label className="text-xs font-medium text-muted-foreground">Program Name</label>
                                                            <Input value={selectedApp.course_applied} disabled className="bg-muted" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-muted-foreground">Program Code</label>
                                                            <Input
                                                                value={selectedApp.enrollment_details?.program_code || ''}
                                                                onChange={(e) => updateDetails(selectedApp.id, { enrollment_details: { ...selectedApp.enrollment_details, program_code: e.target.value } })}
                                                                placeholder="e.g. CSE-2024"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-muted-foreground">Specialization</label>
                                                            <Input
                                                                value={selectedApp.enrollment_details?.specialization || ''}
                                                                onChange={(e) => updateDetails(selectedApp.id, { enrollment_details: { ...selectedApp.enrollment_details, specialization: e.target.value } })}
                                                                placeholder="e.g. AI & ML"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <h5 className="text-sm font-medium border-b pb-1">Batch & Entry</h5>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs font-medium text-muted-foreground">Batch Year</label>
                                                            <Input
                                                                value={selectedApp.enrollment_details?.batch_year || ''}
                                                                onChange={(e) => updateDetails(selectedApp.id, { enrollment_details: { ...selectedApp.enrollment_details, batch_year: e.target.value } })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-muted-foreground">Semester</label>
                                                            <Input
                                                                value={selectedApp.enrollment_details?.semester || ''}
                                                                onChange={(e) => updateDetails(selectedApp.id, { enrollment_details: { ...selectedApp.enrollment_details, semester: e.target.value } })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-muted-foreground">Section</label>
                                                            <Input
                                                                value={selectedApp.enrollment_details?.section || ''}
                                                                onChange={(e) => updateDetails(selectedApp.id, { enrollment_details: { ...selectedApp.enrollment_details, section: e.target.value } })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-muted-foreground">Roll No</label>
                                                            <Input
                                                                value={selectedApp.enrollment_details?.roll_number || ''}
                                                                onChange={(e) => updateDetails(selectedApp.id, { enrollment_details: { ...selectedApp.enrollment_details, roll_number: e.target.value } })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground">Entry Type</label>
                                                        <Select
                                                            value={selectedApp.enrollment_details?.entry_type || 'Regular'}
                                                            onValueChange={(v) => updateDetails(selectedApp.id, { enrollment_details: { ...selectedApp.enrollment_details, entry_type: v } })}
                                                        >
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Regular">Regular / Direct</SelectItem>
                                                                <SelectItem value="Lateral">Lateral Entry</SelectItem>
                                                                <SelectItem value="Management">Management Quota</SelectItem>
                                                                <SelectItem value="NRI">Foreign National</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-[600px] flex flex-col items-center justify-center p-8 border rounded-xl bg-muted/10 text-muted-foreground text-center animate-in fade-in-50">
                            <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 opacity-50" />
                            </div>
                            <h3 className="text-lg font-semibold">No Application Selected</h3>
                            <p className="max-w-xs mx-auto">Select an application from the list to view its detailed lifecycle, verify docs, or manage enrollment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}

