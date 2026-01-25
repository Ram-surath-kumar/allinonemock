
import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, CreditCard, ChevronsUpDown, Check, Bus } from "lucide-react";
import { cn } from "@/lib/utils";

export function TransportationFees() {
    const [open, setOpen] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [transportData, setTransportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Payment Dialog
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("cash");
    const [remarks, setRemarks] = useState("");

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.getUsers({ role: "student" });
                if (res.data) setStudents(res.data);
            } catch (e) {
                console.error("Failed to load students", e);
            }
        };
        fetchStudents();
    }, []);

    const loadTransportData = async (studentId: string) => {
        setLoading(true);
        try {
            const res = await api.getStudentTransportFees(studentId);
            setTransportData(res.data || null);
        } catch (e) {
            toast.error("Failed to load transport details");
            setTransportData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStudent = (student: any) => {
        setSelectedStudent(student);
        setOpen(false);
        if (student) loadTransportData(student.id);
    };

    const openPayment = (payment: any) => {
        setSelectedPayment(payment);
        setAmount((payment.amount_due - (payment.amount_paid || 0)).toString());
        setRemarks("");
        setMethod("cash");
        setIsPayOpen(true);
    };

    const handlePayment = async () => {
        if (!selectedPayment) return;
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Enter a valid amount");
            return;
        }

        try {
            const res = await api.payTransportFee({
                payment_id: selectedPayment.id,
                amount: parseFloat(amount),
                payment_method: method,
                remarks: remarks,
                paid_by: "admin" // or current user id
            });

            if (res.data) {
                toast.success("Payment recorded successfully");
                setIsPayOpen(false);
                loadTransportData(selectedStudent.id);
            } else {
                toast.error(res.error || "Payment failed");
            }
        } catch (e) {
            toast.error("An error occurred");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                <Label>Select Student</Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-[400px] justify-between"
                        >
                            {selectedStudent
                                ? students.find((s) => s.id === selectedStudent.id)?.name || selectedStudent.name
                                : "Search student..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                        <Command>
                            <CommandInput placeholder="Search..." />
                            <CommandList>
                                <CommandEmpty>No student found.</CommandEmpty>
                                <CommandGroup>
                                    {students.map((student) => (
                                        <CommandItem
                                            key={student.id}
                                            value={student.name}
                                            onSelect={() => handleSelectStudent(student)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedStudent?.id === student.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{student.name}</span>
                                                <span className="text-xs text-muted-foreground">{student.loopid}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {selectedStudent && (
                <div className="space-y-6">
                    {/* Student Transport Profile */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Bus className="h-5 w-5 text-primary" />
                                Transport Registration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <p>Loading details...</p>
                            ) : !transportData ? (
                                <div className="text-center py-6 text-muted-foreground">
                                    <p>No active transport registration found for this student.</p>
                                    <p className="text-sm mt-1">Allocate a route in Transportation module first.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Registration ID</p>
                                            <p className="font-medium">{transportData.reg_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Stop Name</p>
                                            <p className="font-medium">{transportData.pickup_stop_name || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Annual Fee</p>
                                            <p className="font-medium">₹{transportData.fee_annual}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Status</p>
                                            <Badge variant="outline">{transportData.status}</Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-3">Fee Installments</h4>
                                        <div className="border rounded-md overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Installment</TableHead>
                                                        <TableHead>Due Date</TableHead>
                                                        <TableHead>Due Amount</TableHead>
                                                        <TableHead>Paid</TableHead>
                                                        <TableHead>Balance</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {transportData.payments?.map((payment: any) => {
                                                        const balance = payment.amount_due - (payment.amount_paid || 0);
                                                        return (
                                                            <TableRow key={payment.id}>
                                                                <TableCell>Term {payment.installment_no}</TableCell>
                                                                <TableCell>
                                                                    {new Date(payment.due_date).toLocaleDateString()}
                                                                </TableCell>
                                                                <TableCell>₹{payment.amount_due}</TableCell>
                                                                <TableCell className="text-green-600 font-medium">
                                                                    ₹{payment.amount_paid || 0}
                                                                </TableCell>
                                                                <TableCell className="text-red-500 font-medium">
                                                                    ₹{balance}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant={
                                                                            payment.status === "Paid"
                                                                                ? "default" // default is usually primary/dark
                                                                                : payment.status === "Partial"
                                                                                    ? "secondary"
                                                                                    : "destructive"
                                                                        }
                                                                        className={
                                                                            payment.status === "Paid" ? "bg-green-600 hover:bg-green-700" : ""
                                                                        }
                                                                    >
                                                                        {payment.status || "Pending"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {balance > 0 && (
                                                                        <Button size="sm" onClick={() => openPayment(payment)}>
                                                                            <CreditCard className="mr-2 h-3 w-3" /> Pay
                                                                        </Button>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                    {!transportData.payments?.length && (
                                                        <TableRow>
                                                            <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                                                                No fee records found.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Collect Transport Fee</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Amount (Max: {selectedPayment ? selectedPayment.amount_due - (selectedPayment.amount_paid || 0) : 0})</Label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Remarks</Label>
                            <Input
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Receipt No / Transaction ID"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handlePayment}>Record Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
