import { useState } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, CreditCard } from 'lucide-react';
import { PaymentGatewayMock } from '@/components/finance/PaymentGatewayMock';
import { useAuth } from '@/contexts/AuthContext';

export function PaymentCollection() {
    const { currentUser } = useAuth();
    const [search, setSearch] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [fees, setFees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Payment Form
    const [assignId, setAssignId] = useState('');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [remarks, setRemarks] = useState('');
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [manageAssignment, setManageAssignment] = useState<any>(null); // For adjustments/installments

    const handleSearch = async () => {
        if (!search) return;
        setLoading(true);
        try {
            // Search by email or name (generic user search)
            // Ideally backend supports 'search' param, here using email/name filter if possible
            // Or just fetching all students and filtering (not scalable but ok for now)
            // Using email param as proxy for search query for now, or just getUsers
            const res = await api.getUsers({ role: 'student' }); // Fetch all students, filter client side for demo
            if (res.data) {
                const filtered = res.data.filter(s =>
                    s.name?.toLowerCase().includes(search.toLowerCase()) ||
                    s.email?.toLowerCase().includes(search.toLowerCase()) ||
                    s.loopid?.toLowerCase().includes(search.toLowerCase())
                );
                setStudents(filtered);
            }
        } catch (e) {
            toast.error("Search failed");
        } finally {
            setLoading(false);
        }
    };

    const selectStudent = async (student: any) => {
        setSelectedStudent(student);
        setStudents([]); // valid UX? Maybe keep list. Clearing for focus.
        loadFees(student.id);
    };

    const loadFees = async (studentId: string) => {
        const res = await api.getStudentFees(studentId);
        if (res.data) setFees(res.data);
    };

    const handlePayment = async () => {
        if (!assignId) return;

        // If Online, show mock gateway
        if (method === 'online') {
            // Close the manual dialog first or keep it open? 
            // Better UX: Close manual dialog, show Gateway.
            setIsPayOpen(false);
            // We need to trigger the gateway. We can use a new state for that.
            // But wait, the dialog logic is currently: user selects method IN the dialog.
            // So if they select 'Online' and click 'Record Payment', we should show the gateway.
            return;
        }

        if (!amount) {
            toast.error("Invalid details");
            return;
        }

        try {
            const res = await api.recordPayment({
                student_id: selectedStudent.id,
                assignment_id: assignId,
                amount: parseFloat(amount),
                payment_method: method,
                remarks,
                created_by: currentUser?.id
            });

            if (res.data) {
                toast.success("Payment Recorded");
                setIsPayOpen(false);
                setAmount(''); setRemarks('');
                loadFees(selectedStudent.id);
            } else {
                toast.error(res.error || "Payment failed");
            }
        } catch (e) {
            toast.error("Payment error");
        }
    };

    const handleOnlinePaySuccess = () => {
        toast.success("Online Payment Received");
        loadFees(selectedStudent.id);
    };

    const openPayment = (assignment: any) => {
        setAssignId(assignment.id);
        setAmount((assignment.net_amount - (assignment.paid_amount || 0)).toString());
        setIsPayOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <Input
                    placeholder="Search student by Name, Email or ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                    <Search className="mr-2 h-4 w-4" /> Search
                </Button>
            </div>

            {students.length > 0 && !selectedStudent && (
                <Card>
                    <CardHeader><CardTitle>Search Results</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {students.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell>{s.name}</TableCell>
                                        <TableCell>{s.email}</TableCell>
                                        <TableCell><Button size="sm" onClick={() => selectStudent(s)}>View Fees</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {selectedStudent && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row justify-between">
                            <div>
                                <CardTitle>{selectedStudent.name}</CardTitle>
                                <CardDescription>{selectedStudent.email}</CardDescription>
                            </div>
                            <Button variant="outline" onClick={() => { setSelectedStudent(null); setStudents([]); }}>Back to Search</Button>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-lg font-semibold mb-2">Fee Assignments</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Structure</TableHead>
                                        <TableHead>Sem/Year</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Paid</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fees.map(f => {
                                        const balance = f.net_amount - (f.paid_amount || 0);
                                        return (
                                            <TableRow key={f.id}>
                                                <TableCell>{f.structure?.name}</TableCell>
                                                <TableCell>{f.structure?.semester} / {f.structure?.batch_year}</TableCell>
                                                <TableCell>₹{f.net_amount}</TableCell>
                                                <TableCell className="text-green-600 font-medium">₹{f.paid_amount}</TableCell>
                                                <TableCell className="text-red-600 font-medium">₹{balance}</TableCell>
                                                <TableCell>
                                                    <Badge variant={f.status === 'paid' ? 'default' : f.status === 'partial' ? 'secondary' : 'destructive'}>
                                                        {f.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {balance > 0 && (
                                                            <Button size="sm" onClick={() => openPayment(f)}>
                                                                <CreditCard className="mr-2 h-3 w-3" /> Pay
                                                            </Button>
                                                        )}
                                                        <Button variant="outline" size="sm" onClick={() => setManageAssignment(f)}>Manage</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Collect Payment</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <Select value={method} onValueChange={setMethod}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="online">Online</SelectItem>
                                            <SelectItem value="cheque">Cheque</SelectItem>
                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Remarks</Label>
                                    <Input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Txn ID, etc." />
                                </div>
                            </div>
                            <DialogFooter>
                                {method === 'online' ? (
                                    <DialogTrigger asChild>
                                        <Button onClick={() => setIsPayOpen(false)}>Proceed to Gateway</Button>
                                    </DialogTrigger>
                                ) : (
                                    <Button onClick={handlePayment}>Record Payment</Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Online Payment Gateway Mock Trigger logic is a bit tricky with the Dialog. 
                        Let's handle it by state. */}
                    {method === 'online' && !isPayOpen && assignId && (
                        <PaymentGatewayMock
                            assignment={fees.find(f => f.id === assignId)}
                            onSuccess={handleOnlinePaySuccess}
                            onClose={() => { setMethod('cash'); setAssignId(''); }}
                        />
                    )}
                </div>
            )}

            {manageAssignment && (
                <ManageFeeDialog
                    assignment={manageAssignment}
                    onClose={() => { setManageAssignment(null); if (selectedStudent) loadFees(selectedStudent.id); }}
                />
            )}
        </div>
    );
}

function ManageFeeDialog({ assignment, onClose }: { assignment: any, onClose: () => void }) {
    const [adjType, setAdjType] = useState('penalty');
    const [adjAmount, setAdjAmount] = useState('');
    const [adjReason, setAdjReason] = useState('');
    const [installments, setInstallments] = useState(0);

    // Refund State
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [refundTxId, setRefundTxId] = useState<string | null>(null);
    const [isRefundOpen, setIsRefundOpen] = useState(false);

    const handleAddAdjustment = async () => {
        if (!adjAmount || !adjReason) return toast.error("Enter amount and reason");
        const res = await api.createAdjustment({
            student_id: assignment.student_id,
            assignment_id: assignment.id,
            type: adjType,
            amount: parseFloat(adjAmount),
            reason: adjReason
        });
        if (res.data) {
            toast.success("Adjustment added");
            setAdjAmount(''); setAdjReason('');
            onClose(); // Close to refresh (simple way)
        } else {
            toast.error("Failed");
        }
    };

    const handleCreateInstallments = async () => {
        if (installments < 2) return toast.error("Min 2 installments");
        const amountPerInst = assignment.net_amount / installments;
        const instList = [];
        for (let i = 0; i < installments; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() + i);
            instList.push({
                due_date: date.toISOString().split('T')[0],
                amount: amountPerInst,
                status: 'pending'
            });
        }
        const res = await api.createInstallments(assignment.id, instList);
        if (res.data) {
            toast.success("Installments created");
            onClose();
        } else {
            toast.error("Failed");
        }
    };

    const handleRefundRequest = async () => {
        if (!refundAmount || !refundReason) return toast.error("Enter amount and reason");
        const res = await api.requestRefund({
            student_id: assignment.student_id,
            payment_id: refundTxId,
            amount: parseFloat(refundAmount),
            reason: refundReason
        });
        if (res.data) {
            toast.success("Refund requested successfully");
            setIsRefundOpen(false);
            setRefundAmount(''); setRefundReason('');
        } else {
            toast.error(res.error || "Failed to request refund");
        }
    };

    const openRefund = (tx: any) => {
        setRefundTxId(tx.id);
        setRefundAmount(tx.amount.toString());
        setIsRefundOpen(true);
    };

    return (
        <Dialog open={true} onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Manage Fee Assignment</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4 border-r pr-4">
                        <h4 className="font-medium">Adjustments (Penalty/Waiver)</h4>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={adjType} onValueChange={setAdjType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="penalty">Penalty (Late Fee)</SelectItem>
                                    <SelectItem value="discount">Waiver / Discount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input type="number" value={adjAmount} onChange={e => setAdjAmount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Input value={adjReason} onChange={e => setAdjReason(e.target.value)} />
                        </div>
                        <Button size="sm" onClick={handleAddAdjustment}>Add Adjustment</Button>


                        <div className="mt-4">
                            <h5 className="text-sm font-medium mb-2">Adjustments History</h5>
                            <div className="text-sm max-h-32 overflow-y-auto border rounded p-2">
                                {assignment.adjustments?.map((a: any) => (
                                    <div key={a.id} className="flex justify-between border-b py-1 last:border-0">
                                        <span>{a.type} ({a.reason})</span>
                                        <span className={a.type === 'penalty' ? 'text-red-500' : 'text-green-500'}>
                                            {a.type === 'penalty' ? '+' : '-'}{a.amount}
                                        </span>
                                    </div>
                                ))}
                                {(!assignment.adjustments || assignment.adjustments.length === 0) && <p className="text-muted-foreground text-xs">No adjustments</p>}
                            </div>
                        </div>

                        <div className="mt-4">
                            <h5 className="text-sm font-medium mb-2">Transaction History</h5>
                            <div className="text-sm max-h-32 overflow-y-auto border rounded p-2">
                                {assignment.transactions?.map((t: any) => (
                                    <div key={t.id} className="flex justify-between items-center border-b py-2 last:border-0">
                                        <div>
                                            <div className="font-medium">{t.payment_method} - {new Date(t.transaction_date).toLocaleDateString()}</div>
                                            <div className="text-xs text-muted-foreground">{t.remarks || 'No remarks'}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-600 font-bold">₹{t.amount}</span>
                                            <Button variant="ghost" size="xs" className="h-6 text-xs text-orange-600" onClick={() => openRefund(t)}>Refund</Button>
                                        </div>
                                    </div>
                                ))}
                                {(!assignment.transactions || assignment.transactions.length === 0) && <p className="text-muted-foreground text-xs">No transactions</p>}
                            </div>
                        </div>
                    </div>

                    <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Request Refund</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Refund Amount</Label>
                                    <Input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Reason</Label>
                                    <Input value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="e.g. Double payment, Withdrawal" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleRefundRequest} variant="destructive">Submit Request</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <div className="space-y-4">
                        <h4 className="font-medium">Installments</h4>
                        {!assignment.installments || assignment.installments.length === 0 ? (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">Split the remaining amount into monthly installments.</p>
                                <div className="space-y-2">
                                    <Label>Number of Installments</Label>
                                    <Input type="number" min="2" max="12" value={installments} onChange={e => setInstallments(parseInt(e.target.value))} />
                                </div>
                                <Button size="sm" onClick={handleCreateInstallments}>Create Plan</Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {assignment.installments.map((inst: any, i: number) => (
                                    <div key={inst.id} className="flex justify-between items-center border p-2 rounded">
                                        <span className="text-sm">Inst {i + 1} ({inst.due_date})</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">₹{inst.amount}</span>
                                            <Badge variant="outline">{inst.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

