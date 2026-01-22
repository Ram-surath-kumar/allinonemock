import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
    CheckCircle2, Clock, XCircle, FileText, IndianRupee, GraduationCap,
    Award, Building2, UserCheck, Users, FileCheck, RefreshCcw, MapPin,
    Contact, HeartPulse, AlertCircle, Save
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/services/api';

export function AdmissionPortal() {
    // Main Tabs State
    const [activeTab, setActiveTab] = useState("applications");

    // Applications Data
    const [admissions, setAdmissions] = useState([]);
    const [stats, setStats] = useState({ total: 0, status: {}, courses: {} });
    const [loading, setLoading] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);

    // Exams Data
    const [exams, setExams] = useState([]); // Placeholder if we had an endpoint

    // Form State
    const [isApplyOpen, setIsApplyOpen] = useState(false);
    const [formData, setFormData] = useState({
        applicant_name: '',
        email: '',
        phone: '',
        course_applied: '',
        dob: '',
        entrance_exam_details: { exam_name: '', marks: '', total_marks: '', rank: '' },
        academic_qualifications: { tenth_marks: '', tenth_board: '', twelfth_marks: '', twelfth_board: '' },
        // UGC/AICTE Fields - Personal
        study_mode: 'Regular',
        gender: '',
        category: 'General',
        bpl_status: false,
        minority_status: false,
        minority_type: '',
        pwd_status: false,
        first_graduate: false,
        nationality_type: 'Indian',
        // Detailed Info
        address_info: { current: {}, permanent: {} },
        guardian_info: { father: {}, mother: {}, guardian: {} },
        medical_history: {},
        documents: {}
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
            // Map flat form booleans back to object structure if needed, 
            // but our current backend expects flat booleans for flags and jsonb for details.
            // Our backend migration added address_info etc.

            const payload = {
                ...formData,
                is_bpl: formData.bpl_status,
                is_pwd: formData.pwd_status,
                is_minority: formData.minority_status,
                // Ensure helper booleans are present as expected by backend or mapped correctly
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/sim/admissions/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
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
            console.error(error);
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

    const updateNestedForm = (section, field, value, subSection = null) => {
        setFormData(prev => {
            if (subSection) {
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [subSection]: {
                            ...prev[section]?.[subSection],
                            [field]: value
                        }
                    }
                };
            }
            // If section is null, update root
            if (!section) {
                return { ...prev, [field]: value };
            }
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            };
        });
    };

    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e, docType) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `admissions/${fileName}`;

            const { data, error } = await supabase.storage
                .from('documents') // Ensure this bucket exists in Supabase
                .upload(filePath, file);

            if (error) {
                console.error('Upload Error:', error);
                // Fallback for demo/dev if bucket doesn't exist: use a fake URL
                // toast.error(`Upload failed: ${error.message}`);
                // return;

                // Allow proceeding with fake URL for demo purposes if storage fails (common in incomplete setups)
                toast.warning("Storage upload failed. Using local mockup for demo.");
                const mockUrl = URL.createObjectURL(file);
                updateNestedForm('documents', docType, mockUrl);
            } else {
                const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
                updateNestedForm('documents', docType, publicUrl);
                toast.success('Document uploaded');
            }
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
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

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Admission Management</h2>
                    <p className="text-muted-foreground">Manage entire admission lifecycle from application to enrollment.</p>
                </div>

                {activeTab === 'applications' && (
                    <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2"><FileText className="h-4 w-4" /> New Application</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>New Student Application</DialogTitle></DialogHeader>
                            <form onSubmit={handleApply} className="space-y-6 mt-4">
                                <Tabs defaultValue="personal" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto mb-4">
                                        <TabsTrigger value="personal">Personal</TabsTrigger>
                                        <TabsTrigger value="address">Address</TabsTrigger>
                                        <TabsTrigger value="family">Family</TabsTrigger>
                                        <TabsTrigger value="medical">Medical</TabsTrigger>
                                        <TabsTrigger value="course">Course</TabsTrigger>
                                        <TabsTrigger value="exam">Exam</TabsTrigger>
                                        <TabsTrigger value="docs">Docs</TabsTrigger>
                                    </TabsList>

                                    {/* 1. Personal Tab */}
                                    <TabsContent value="personal" className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label>Full Name</Label><Input value={formData.applicant_name} onChange={e => setFormData({ ...formData, applicant_name: e.target.value })} required /></div>
                                            <div><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></div>
                                            <div><Label>Phone</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required /></div>
                                            <div>
                                                <Label>Date of Birth</Label>
                                                <Input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} max={new Date(new Date().setFullYear(new Date().getFullYear() - 15)).toISOString().split('T')[0]} required />
                                            </div>
                                            <div>
                                                <Label>Gender</Label>
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
                                                <Label>Category</Label>
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
                                                <Label>Nationality</Label>
                                                <Select value={formData.nationality_type} onValueChange={v => setFormData({ ...formData, nationality_type: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Indian">Indian National</SelectItem>
                                                        <SelectItem value="NRI">NRI</SelectItem>
                                                        <SelectItem value="Foreign">Foreign National</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={formData.bpl_status} onChange={e => setFormData({ ...formData, bpl_status: e.target.checked })} /><Label>Below Poverty Line (BPL)</Label></div>
                                            <div className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={formData.pwd_status} onChange={e => setFormData({ ...formData, pwd_status: e.target.checked })} /><Label>Person w/ Disability (PWD)</Label></div>
                                            <div className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={formData.minority_status} onChange={e => setFormData({ ...formData, minority_status: e.target.checked })} /><Label>Minority Community</Label></div>
                                            <div className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={formData.first_graduate} onChange={e => setFormData({ ...formData, first_graduate: e.target.checked })} /><Label>First Graduate</Label></div>
                                        </div>
                                    </TabsContent>

                                    {/* 2. Address Tab */}
                                    <TabsContent value="address" className="space-y-4">
                                        <Card>
                                            <CardHeader><CardTitle className="text-base">Current Address</CardTitle></CardHeader>
                                            <CardContent className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2"><Label>Street Address</Label><Textarea value={formData.address_info?.current?.street || ''} onChange={e => updateNestedForm('address_info', 'street', e.target.value, 'current')} /></div>
                                                <div><Label>City</Label><Input value={formData.address_info?.current?.city || ''} onChange={e => updateNestedForm('address_info', 'city', e.target.value, 'current')} /></div>
                                                <div><Label>State</Label><Input value={formData.address_info?.current?.state || ''} onChange={e => updateNestedForm('address_info', 'state', e.target.value, 'current')} /></div>
                                                <div><Label>Zip Code</Label><Input value={formData.address_info?.current?.zip || ''} onChange={e => updateNestedForm('address_info', 'zip', e.target.value, 'current')} /></div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* 3. Family Tab */}
                                    <TabsContent value="family" className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2 border p-3 rounded">
                                                <h4 className="font-semibold">Father</h4>
                                                <Label>Name</Label><Input value={formData.guardian_info?.father?.name || ''} onChange={e => updateNestedForm('guardian_info', 'name', e.target.value, 'father')} />
                                                <Label>Occupation</Label><Input value={formData.guardian_info?.father?.occupation || ''} onChange={e => updateNestedForm('guardian_info', 'occupation', e.target.value, 'father')} />
                                                <Label>Phone</Label><Input value={formData.guardian_info?.father?.phone || ''} onChange={e => updateNestedForm('guardian_info', 'phone', e.target.value, 'father')} />
                                            </div>
                                            <div className="space-y-2 border p-3 rounded">
                                                <h4 className="font-semibold">Mother</h4>
                                                <Label>Name</Label><Input value={formData.guardian_info?.mother?.name || ''} onChange={e => updateNestedForm('guardian_info', 'name', e.target.value, 'mother')} />
                                                <Label>Occupation</Label><Input value={formData.guardian_info?.mother?.occupation || ''} onChange={e => updateNestedForm('guardian_info', 'occupation', e.target.value, 'mother')} />
                                                <Label>Phone</Label><Input value={formData.guardian_info?.mother?.phone || ''} onChange={e => updateNestedForm('guardian_info', 'phone', e.target.value, 'mother')} />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* 4. Medical Tab */}
                                    <TabsContent value="medical" className="space-y-4">
                                        <div><Label>Known Allergies</Label><Textarea value={formData.medical_history?.allergies || ''} onChange={e => updateNestedForm('medical_history', 'allergies', e.target.value)} /></div>
                                        <div><Label>Chronic Conditions</Label><Textarea value={formData.medical_history?.chronic_illness || ''} onChange={e => updateNestedForm('medical_history', 'chronic_illness', e.target.value)} /></div>
                                        <div><Label>Emergency Doctor Contact</Label><Input value={formData.medical_history?.doctor_contact || ''} onChange={e => updateNestedForm('medical_history', 'doctor_contact', e.target.value)} /></div>
                                    </TabsContent>

                                    {/* 5. Course Tab */}
                                    <TabsContent value="course" className="space-y-4">
                                        <div>
                                            <Label>Course Applying For</Label>
                                            <Select onValueChange={v => setFormData({ ...formData, course_applied: v })}>
                                                <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="B.Tech Computer Science">B.Tech Computer Science</SelectItem>
                                                    <SelectItem value="B.Tech Electronics">B.Tech Electronics</SelectItem>
                                                    <SelectItem value="BBA">BBA</SelectItem>
                                                    <SelectItem value="MBA">MBA</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Study Mode</Label>
                                            <Select value={formData.study_mode} onValueChange={v => setFormData({ ...formData, study_mode: v })}>
                                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Regular">Regular (Full-time)</SelectItem>
                                                    <SelectItem value="Part-Time">Part-Time</SelectItem>
                                                    <SelectItem value="Distance">Distance Learning</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </TabsContent>

                                    {/* 6. Exam Tab */}
                                    <TabsContent value="exam" className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label>Exam Name</Label><Input value={formData.entrance_exam_details.exam_name} onChange={e => updateNestedForm('entrance_exam_details', 'exam_name', e.target.value)} placeholder="JEE / CAT" /></div>
                                            <div><Label>Rank</Label><Input value={formData.entrance_exam_details.rank} onChange={e => updateNestedForm('entrance_exam_details', 'rank', e.target.value)} /></div>
                                            <div><Label>Marks</Label><Input type="number" value={formData.entrance_exam_details.marks} onChange={e => updateNestedForm('entrance_exam_details', 'marks', e.target.value)} /></div>
                                            <div><Label>Total Marks</Label><Input type="number" value={formData.entrance_exam_details.total_marks} onChange={e => updateNestedForm('entrance_exam_details', 'total_marks', e.target.value)} /></div>
                                        </div>
                                        <div className="border-t pt-4 mt-4">
                                            <h4 className="font-semibold mb-2">Qualifications</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><Label>10th Marks (%)</Label><Input value={formData.academic_qualifications.tenth_marks} onChange={e => updateNestedForm('academic_qualifications', 'tenth_marks', e.target.value)} /></div>
                                                <div><Label>12th Marks (%)</Label><Input value={formData.academic_qualifications.twelfth_marks} onChange={e => updateNestedForm('academic_qualifications', 'twelfth_marks', e.target.value)} /></div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* 7. Docs Tab */}
                                    <TabsContent value="docs" className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="border border-dashed p-6 rounded text-center cursor-pointer hover:bg-muted/50 relative">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => handleFileUpload(e, 'aadhar_card')}
                                                    disabled={uploading}
                                                />
                                                <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                                <span className="text-sm font-medium d-block">Upload Aadhar</span>
                                                {formData.documents?.aadhar_card && (
                                                    <p className="text-xs text-green-600 mt-1 font-medium flex items-center justify-center gap-1">
                                                        <FileCheck className="h-3 w-3" /> Selected
                                                    </p>
                                                )}
                                                {uploading && <span className="text-xs text-muted-foreground block mt-1">Uploading...</span>}
                                            </div>
                                            <div className="border border-dashed p-6 rounded text-center cursor-pointer hover:bg-muted/50 relative">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => handleFileUpload(e, 'marksheet_12th')}
                                                    disabled={uploading}
                                                />
                                                <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                                <span className="text-sm font-medium d-block">Upload 12th Marksheet</span>
                                                {formData.documents?.marksheet_12th && (
                                                    <p className="text-xs text-green-600 mt-1 font-medium flex items-center justify-center gap-1">
                                                        <FileCheck className="h-3 w-3" /> Selected
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                                <Button type="submit" className="w-full" size="lg">Submit Application</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-muted/20 border">
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                    <TabsTrigger value="exams">Entrance Exams</TabsTrigger>
                    <TabsTrigger value="merit">Merit Lists</TabsTrigger>
                </TabsList>

                {/* TAB 1: APPLICATIONS (Existing View) */}
                <TabsContent value="applications" className="space-y-4">
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
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Shortlisted</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{(stats.status['offered'] || 0) + (stats.status['shortlisted'] || 0)}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Admitted</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{stats.status['admitted'] || 0}</div></CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
                        {/* List */}
                        <Card className="lg:col-span-1 border-muted h-full flex flex-col">
                            <CardHeader><CardTitle>Applications</CardTitle></CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden">
                                <ScrollArea className="h-full">
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
                                                        <div className="text-xs text-muted-foreground">{app.application_no} • {app.course_applied}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="outline" className={`${getStatusColor(app.status)} text-[10px]`}>
                                                            {app.status.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {admissions.length === 0 && (
                                                <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No applications found</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Detail View */}
                        <div className="lg:col-span-2 h-full overflow-y-auto">
                            {selectedApp ? (
                                <Card className="h-full flex flex-col">
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
                                    <CardContent className="p-0 flex-1 overflow-y-auto">
                                        <Tabs defaultValue="overview" className="w-full">
                                            <TabsList className="w-full justify-start rounded-none border-b h-12">
                                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                                <TabsTrigger value="merit_offer">Merit & Offer</TabsTrigger>
                                                <TabsTrigger value="verification">Verification</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="overview" className="p-4 space-y-6">
                                                {/* Details Grid */}
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/10 rounded-lg">
                                                    <div><span className="text-xs text-muted-foreground uppercase">Email</span><div className="font-medium">{selectedApp.email}</div></div>
                                                    <div><span className="text-xs text-muted-foreground uppercase">Phone</span><div className="font-medium">{selectedApp.phone || '-'}</div></div>
                                                    <div><span className="text-xs text-muted-foreground uppercase">DOB</span><div className="font-medium">{selectedApp.dob || '-'}</div></div>
                                                    <div><span className="text-xs text-muted-foreground uppercase">Category</span><div className="font-medium">{selectedApp.category || 'General'}</div></div>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="border rounded p-4">
                                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Award className="h-4 w-4" /> Academic Info</h4>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between"><span>10th Marks</span><span className="font-medium">{selectedApp.academic_qualifications?.tenth_marks}%</span></div>
                                                            <div className="flex justify-between"><span>12th Marks</span><span className="font-medium">{selectedApp.academic_qualifications?.twelfth_marks}%</span></div>
                                                            <div className="flex justify-between"><span>Exam Name</span><span className="font-medium">{selectedApp.entrance_exam_details?.exam_name || '-'}</span></div>
                                                            <div className="flex justify-between"><span>Exam Score</span><span className="font-medium">{selectedApp.entrance_exam_details?.marks || '-'}</span></div>
                                                        </div>
                                                    </div>
                                                    {(selectedApp.address_info?.current?.city || selectedApp.guardian_info?.father?.name) && (
                                                        <div className="border rounded p-4">
                                                            <h4 className="font-semibold mb-2 flex items-center gap-2"><Contact className="h-4 w-4" /> Personal Profile</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between"><span>City</span><span className="font-medium">{selectedApp.address_info?.current?.city || '-'}</span></div>
                                                                <div className="flex justify-between"><span>Father</span><span className="font-medium">{selectedApp.guardian_info?.father?.name || '-'}</span></div>
                                                                <div className="flex justify-between"><span>Medical</span><span className="font-medium">{selectedApp.medical_history?.allergies ? 'Recorded' : '-'}</span></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="merit_offer" className="p-4 space-y-6">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold">Merit Ranking</h4>
                                                        <div className="space-y-2">
                                                            <Label>Merit Rank</Label>
                                                            <Input value={selectedApp.merit_details?.merit_rank || ''} onChange={(e) => updateDetails(selectedApp.id, { merit_details: { ...selectedApp.merit_details, merit_rank: e.target.value } })} placeholder="Rank" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold">Offer Details</h4>
                                                        <div className="space-y-2">
                                                            <Label>Offer Date</Label>
                                                            <DatePicker date={selectedApp.offer_details?.offer_date} setDate={(d) => updateDetails(selectedApp.id, { offer_details: { ...selectedApp.offer_details, offer_date: d } })} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="verification" className="p-4">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 p-3 border rounded bg-muted/20">
                                                        <FileCheck className="h-5 w-5 text-blue-600" />
                                                        <span className="font-medium">Document Verification Status</span>
                                                        <div className="ml-auto">
                                                            <Badge variant="outline">{selectedApp.status === 'verified' ? 'Verified' : 'Pending'}</Badge>
                                                        </div>
                                                    </div>
                                                    <Button onClick={() => updateStatus(selectedApp.id, 'verified')} disabled={selectedApp.status === 'verified'}>Mark Documents as Verified</Button>
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground border rounded-lg border-dashed">Select an application to view details</div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: ENTRANCE EXAMS (Ported from AdmissionAdmin) */}
                <TabsContent value="exams" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Entrance Exams</CardTitle>
                            <CardDescription>Manage exams and record student scores.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4 border p-4 rounded-lg">
                                    <h3 className="font-semibold">Create New Exam</h3>
                                    <div className="space-y-2">
                                        <Label>Exam Name</Label>
                                        <Input id="examName" placeholder="e.g. JEE Main 2026" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input id="examDate" type="date" />
                                    </div>
                                    <Button onClick={async () => {
                                        const name = document.getElementById('examName').value;
                                        const date = document.getElementById('examDate').value;
                                        if (!name || !date) return toast.error("Fill all fields");
                                        try {
                                            await api.createEntranceExam({ name, exam_code: name.replace(/\s+/g, '_').toUpperCase(), academic_year: '2025-2026', exam_date: date, max_score: 360 });
                                            toast.success("Exam created");
                                        } catch (e) { toast.error("Failed to create exam"); }
                                    }}>Create Exam</Button>
                                </div>

                                <div className="space-y-4 border p-4 rounded-lg">
                                    <h3 className="font-semibold">Enter Student Score</h3>
                                    <div className="space-y-2">
                                        <Label>Application ID (Admission ID)</Label>
                                        <Input id="scoreAppId" placeholder="UUID" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Score</Label>
                                        <Input id="scoreValue" type="number" placeholder="280" />
                                    </div>
                                    <Button onClick={() => toast.info("Feature placeholder: Score submission")}>Submit Score</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: MERIT LISTS (Ported from AdmissionAdmin) */}
                <TabsContent value="merit" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Merit List Generation</CardTitle>
                            <CardDescription>Automatically shortlist students based on cutoffs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>List Name</Label>
                                        <Input id="mlName" defaultValue="Round 1 - CS" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Course</Label>
                                        <Select defaultValue="B.Tech Computer Science">
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="B.Tech Computer Science">B.Tech Computer Science</SelectItem>
                                                <SelectItem value="B.Tech Electronics">B.Tech Electronics</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cut-off Score</Label>
                                        <Input type="number" defaultValue="90" id="mlCutoff" />
                                    </div>
                                    <Button onClick={async () => {
                                        const name = document.getElementById('mlName').value;
                                        const cutoff = document.getElementById('mlCutoff').value;
                                        try {
                                            const res = await api.generateMeritList({
                                                name,
                                                academic_year: '2025-2026',
                                                course_identifier: 'B.Tech Computer Science', // simplified
                                                cut_off_score: Number(cutoff),
                                                round_number: 1,
                                                category: 'General'
                                            });
                                            if (res.data) toast.success(`List Generated! ${res.data.candidates_shortlisted || 0} candidates shortlisted.`);
                                        } catch (e) { toast.error("Failed to generate list"); }
                                    }}>Generate & Publish List</Button>
                                </div>
                                <div className="border rounded-lg p-4 bg-muted/20">
                                    <h4 className="font-semibold mb-2">Instructions</h4>
                                    <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                                        <li>Ensure all applicant scores are entered.</li>
                                        <li>Only "Verified" applications are considered.</li>
                                        <li>Students meeting cutoff will be moved to "Merit Listed".</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
