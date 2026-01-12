import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function AdmissionPortal() {
    const [admissions, setAdmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isApplyOpen, setIsApplyOpen] = useState(false);

    // New application form state
    const [formData, setFormData] = useState({
        applicant_name: '',
        email: '',
        phone: '',
        course_applied: '',
        dob: ''
    });

    useEffect(() => {
        fetchAdmissions();
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
                toast.success('Status updated');
                fetchAdmissions();
            }
        } catch (error) {
            toast.error('Update failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Admission Management</h2>
                    <p className="text-muted-foreground">Manage applications, merit lists, and enrollments</p>
                </div>

                <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                    <DialogTrigger asChild>
                        <Button>New Application</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>New Student Application</DialogTitle></DialogHeader>
                        <form onSubmit={handleApply} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Full Name</label>
                                <Input value={formData.applicant_name} onChange={e => setFormData({ ...formData, applicant_name: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Phone</label>
                                    <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Course</label>
                                    <Select onValueChange={v => setFormData({ ...formData, course_applied: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="B.Tech CS">B.Tech CS</SelectItem>
                                            <SelectItem value="B.Tech EC">B.Tech EC</SelectItem>
                                            <SelectItem value="BBA">BBA</SelectItem>
                                            <SelectItem value="MBA">MBA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">DOB</label>
                                    <Input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                                </div>
                            </div>
                            <Button type="submit" className="w-full">Submit Application</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader><CardTitle>Applications</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>App ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Course</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admissions.map(app => (
                                <TableRow key={app.id}>
                                    <TableCell className="font-mono text-xs">{app.application_no}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{app.applicant_name}</div>
                                        <div className="text-xs text-muted-foreground">{app.email}</div>
                                    </TableCell>
                                    <TableCell>{app.course_applied}</TableCell>
                                    <TableCell>{app.entrance_exam_score || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            app.status === 'admitted' ? 'bg-green-100 text-green-800 border-green-200' :
                                                app.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                                                    app.status === 'merit_listed' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''
                                        }>
                                            {app.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {app.status === 'applied' && (
                                            <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, 'merit_listed')}>Shortlist</Button>
                                        )}
                                        {app.status === 'merit_listed' && (
                                            <Button size="sm" onClick={() => updateStatus(app.id, 'admitted')}>Admit</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {admissions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No applications found</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
