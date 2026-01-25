
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, FileDown, RefreshCw, Wand2, Search } from "lucide-react"; // Added Wand2, Pencil, Search
import { RippleLoader } from "@/components/ui/RippleLoader";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { supabase } from "@/lib/supabase";

export function HostelFees() {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [fees, setFees] = useState<any[]>([]); // Type fix

    const [error, setError] = useState<string | null>(null);

    // Edit State
    const [editOpen, setEditOpen] = useState(false);
    const [selectedFee, setSelectedFee] = useState<any>(null);
    const [editStatus, setEditStatus] = useState("pending");
    const [editPaidAmount, setEditPaidAmount] = useState("");

    useEffect(() => {
        // console.log("HostelFees Component Mounted");
        fetchFees();
    }, []);

    const fetchFees = async () => {
        // console.log("Init fetchFees...");
        try {
            setLoading(true);
            setError(null);

            // console.log("Calling API endpoint: /finance/assignments?type=Hostel");
            const { data: { session } } = await supabase.auth.getSession(); // Fix: use direct supabase
            const token = session?.access_token;

            if (!token) {
                // Try getting session from internal client if direct access fails
                // Or just rely on api client if token access is tricky here
                // Fallback to standar api for now but with explicit error handling
                // throw new Error("No auth token available");
            }

            // Direct fetch attempt for debugging
            // Using standard api client with heavy logging first as confirmed in previous step
            const response = await api.get('/finance/assignments', {
                type: 'Hostel',
                search: searchTerm,
                _t: Date.now().toString()
            });

            // console.log("API Response received:", response);

            if (response.data) {
                // console.log("Setting Fees Data:", response.data.length, "items");
                setFees(response.data);
            } else if (response.error) {
                console.error("API Error Response:", response.error);
                setError(response.error);
            } else {
                console.warn("API returned no data and no error");
                // Don't show error if just empty, but log it
                if (!response.data && !fees.length) {
                    // setError("No data received from server"); 
                }
            }
        } catch (err: any) {
            console.error("Critical Fetch Error:", err);
            setError(err.message || "Unknown client error");
        } finally {
            setLoading(false);
        }
    };

    const repairFees = async () => {
        if (!confirm("This will scan all active hostel allocations and generate missing fee records. Continue?")) return;

        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession(); // Fix: use direct supabase
            const token = session?.access_token;

            const response = await fetch('http://localhost:3001/api/finance/repair-hostel-fees', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            console.log("Repair Result:", result);
            alert(`Repair Complete.\nProcessed: ${result.data?.total}\nSuccess: ${result.data?.success}\nFailed: ${result.data?.failed}`);
            fetchFees();
        } catch (err: any) {
            alert("Repair Failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: any) => {
        e.preventDefault();
        fetchFees();
    };

    const handleEditClick = (fee: any) => {
        setSelectedFee(fee);
        setEditStatus(fee.status);
        setEditPaidAmount(fee.paid_amount || "");
        setEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedFee) return;

        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            // Use direct fetch to match other manual calls, or use api if extended
            const response = await fetch(`http://localhost:3001/api/finance/assignments/${selectedFee.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: editStatus,
                    paid_amount: editPaidAmount ? parseFloat(editPaidAmount) : undefined
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to update");
            }

            toast.success ? toast.success("Updated successfully") : alert("Updated successfully");
            setEditOpen(false);
            fetchFees();

        } catch (err: any) {
            alert("Update Failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount || 0);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-medium">Hostel Fee History</h3>
                    <p className="text-sm text-muted-foreground">
                        Track allocation fees and payment status
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search student..."
                                className="pl-8 w-[200px] lg:w-[300px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            Search
                        </Button>
                    </form>
                    <Button variant="outline" size="sm" onClick={repairFees} title="Fix Missing Data">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Fix Data
                    </Button>
                    <Button variant="outline" size="icon" onClick={fetchFees} title="Refresh">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button variant="outline" size="icon" title="Export">
                        <FileDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 m-4 border border-red-200 rounded">
                            <strong>Error Loading Data:</strong> {error}
                            <br />
                            <small>Check console for technical details.</small>
                        </div>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Fee Description</TableHead>
                                <TableHead>Assigned Date</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        {loading ? <RippleLoader className="min-h-[100px]" /> : "No records found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                fees.map((fee) => (
                                    <TableRow key={fee.id}>
                                        <TableCell>
                                            <div className="font-medium">{fee.student?.name || "Unknown"}</div>
                                            <div className="text-xs text-muted-foreground">{fee.student?.loopid || fee.student?.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{fee.structure?.name || "Hostel Fee"}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {fee.structure?.semester || "Annual"} • {fee.structure?.batch_year}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(fee.assigned_date || fee.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(fee.net_amount)}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                            {formatCurrency(fee.paid_amount || 0)}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                            {formatCurrency(fee.net_amount - (fee.paid_amount || 0))}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={fee.status === "paid" ? "secondary" : "default"}
                                                className={
                                                    fee.status === "paid"
                                                        ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                                                        : fee.status === "partial"
                                                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                            : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                                                }
                                            >
                                                {fee.status === "paid"
                                                    ? "Paid"
                                                    : fee.status === "partial"
                                                        ? "Partial"
                                                        : "Pending"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(fee)}>
                                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Fee Status</DialogTitle>
                        <DialogDescription>
                            Manually update the status and paid amount for this fee record.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">
                                Status
                            </Label>
                            <Select value={editStatus} onValueChange={setEditStatus}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="partial">Partial</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="paid_amount" className="text-right">
                                Paid Amount
                            </Label>
                            <Input
                                id="paid_amount"
                                type="number"
                                value={editPaidAmount}
                                onChange={(e) => setEditPaidAmount(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
