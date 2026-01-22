import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Search, User, HeartPulse, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function StudentEnrollment() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [student, setStudent] = useState<any>(null);
    const [routes, setRoutes] = useState<any[]>([]);
    const [currentReg, setCurrentReg] = useState<any>(null);

    // Form
    const [formData, setFormData] = useState({
        route_id: '',
        trip_type: 'Both',
        pickup_point_id: '',
        seat_number: '',
        preferred_seating: 'Window',
        medical_conditions: '',
        allergies: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        fee_monthly: '800', // Default
        fee_annual: '9600'
    });

    // Derived state
    const selectedRoute = routes.find(r => r.id === formData.route_id);
    const stops = selectedRoute?.stops || [];

    useEffect(() => {
        api.get('/transport/routes').then(res => setRoutes(res.data || []));
    }, []);

    const handleSearch = async () => {
        api.getUsers().then(res => {
            const found = res.data?.find((u: any) => u.loopid === searchTerm || u.email === searchTerm);
            if (found) {
                setStudent(found);
                // Check if already registered
                api.get(`/transport/student/${found.user_id}`).then(r => {
                    if (r.data) setCurrentReg(r.data);
                    else setCurrentReg(null);
                });
            } else {
                toast({ title: 'Not Found', variant: 'destructive' });
            }
        });
    };

    const handleSubmit = async () => {
        if (!student) return;
        const payload = { ...formData, student_id: student.user_id, academic_year: '2024-2025' };
        const res = await api.post('/transport/register', payload);
        if (res.data) {
            toast({ title: 'Enrolled!', description: `Reg ID: ${res.data.reg_id}` });
            setCurrentReg(res.data);
        } else {
            toast({ title: 'Error', description: res.error, variant: 'destructive' });
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* LEFT COLUMN: SEARCH & REG FORM */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Passenger Search</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Input placeholder="LoopID / Email" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <Button onClick={handleSearch}><Search className="h-4 w-4" /></Button>
                    </CardContent>
                </Card>

                {student && !currentReg && (
                    <Card className="animate-in slide-in-from-left-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                New Enrollment <Badge>2024-2025</Badge>
                            </CardTitle>
                            <CardDescription>Configure transport for {student.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Route Selection */}
                            <div className="space-y-3 p-3 border rounded bg-muted/20">
                                <Label className="text-secondary-foreground font-semibold">Route Selection</Label>
                                <Select onValueChange={v => setFormData({ ...formData, route_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select Route" /></SelectTrigger>
                                    <SelectContent>
                                        {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_name} ({r.route_type})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {selectedRoute && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label>Pickup</Label>
                                            <Select onValueChange={v => setFormData({ ...formData, pickup_point_id: v })}>
                                                <SelectTrigger><SelectValue placeholder="Stop" /></SelectTrigger>
                                                <SelectContent>
                                                    {stops.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.stop_name} ({s.arrival_time})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Seat Preference</Label>
                                            <Select onValueChange={v => setFormData({ ...formData, preferred_seating: v })} defaultValue="Window">
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Window">Window</SelectItem>
                                                    <SelectItem value="Aisle">Aisle</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Medical / Passenger Info */}
                            <div className="space-y-3 p-3 border rounded bg-red-50 dark:bg-red-900/10">
                                <Label className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold"><HeartPulse className="h-4 w-4" /> Medical & Emergency</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="col-span-2">
                                        <Label>Contact Name</Label>
                                        <Input placeholder="Parent Name" onChange={e => setFormData({ ...formData, emergency_contact_name: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Contact Phone</Label>
                                        <Input placeholder="+91..." onChange={e => setFormData({ ...formData, emergency_contact_phone: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Medical Conditions / Allergies</Label>
                                        <Input placeholder="Asthma, Peanuts..." onChange={e => setFormData({ ...formData, medical_conditions: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Fee Preview */}
                            <div className="space-y-3 p-3 border rounded bg-green-50 dark:bg-green-900/10">
                                <Label className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold"><CreditCard className="h-4 w-4" /> Fees</Label>
                                <div className="flex justify-between text-sm">
                                    <span>Monthly Fee:</span>
                                    <span className="font-bold">₹{formData.fee_monthly}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Annual Fee:</span>
                                    <span className="font-bold">₹{formData.fee_annual}</span>
                                </div>
                            </div>

                            <Button className="w-full" onClick={handleSubmit}>Confirm Enrollment</Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* RIGHT COLUMN: EXISTING DETAILS OR STUDENT PROFILE */}
            <div className="space-y-6">
                {student ? (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>{student.name}</CardTitle>
                            <CardDescription>{student.loopid}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {currentReg ? (
                                <div className="space-y-6">
                                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Registration ID</p>
                                                <p className="text-xl font-mono font-bold text-primary">{currentReg.reg_id}</p>
                                            </div>
                                            <Badge>Active</Badge>
                                        </div>
                                        <Separator className="my-2" />
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Route</p>
                                                <p className="font-medium">RT-TEST</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Seat</p>
                                                <p className="font-medium">{currentReg.seat_number || 'Pending'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment History</h4>
                                        <div className="space-y-2">
                                            {currentReg.payments?.map((p: any) => (
                                                <div key={p.id} className="flex justify-between items-center p-2 border rounded bg-card">
                                                    <div>
                                                        <p className="font-medium">Installment {p.installment_no}</p>
                                                        <p className="text-xs text-muted-foreground">Due: {p.due_date?.split('T')[0]}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p>₹{p.amount_due}</p>
                                                        <Badge variant={p.status === 'Paid' ? 'default' : 'destructive'}>{p.status}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!currentReg.payments || currentReg.payments.length === 0) && <p className="text-sm text-muted-foreground">No payment records.</p>}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    Student not enrolled in transport.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground p-10">
                        Search for a student to view details.
                    </div>
                )}
            </div>
        </div>
    );
}
