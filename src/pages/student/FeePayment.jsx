import { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  XCircle,
  Calendar,
  Download,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RippleLoader } from "@/components/ui/RippleLoader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function FeePayment() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalFees: 0,
    paidFees: 0,
    pendingFees: 0,
    overdueFees: 0,
    paidPercentage: 0,
  });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadFeeData();
    }
  }, [currentUser]);

  const loadFeeData = async () => {
    try {
      setLoading(true);
      // Mock fee data - replace with actual API call
      const mockPayments = [
        {
          id: "1",
          feeType: "College Fee",
          totalAmount: 45000,
          amount: 45000,
          dueDate: "2024-04-15",
          paidDate: null,
          status: "pending",
          paymentMethod: null,
          transactionId: null,
          receiptUrl: null,
        },
        {
          id: "2",
          feeType: "Hostel Fee",
          totalAmount: 22000,
          amount: 0, // Fully paid, so pending is 0
          dueDate: "2024-04-10",
          status: "paid",
          paidDate: "2024-03-01",
          paymentMethod: "UPI",
          transactionId: "TXN99887766",
          receiptUrl: "#",
        },
        {
          id: "3",
          feeType: "Transport Fee",
          totalAmount: 8500,
          amount: 8500,
          dueDate: "2024-04-05",
          status: "overdue",
          paidDate: null,
          paymentMethod: null,
          transactionId: null,
          receiptUrl: null,
        }
      ];

      setPayments(mockPayments);

      // Calculate summary
      const total = mockPayments.reduce((sum, p) => sum + p.totalAmount, 0);
      const paid = mockPayments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.totalAmount, 0);
      const pending = mockPayments
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0); // Use p.amount for pending
      const overdue = mockPayments
        .filter((p) => p.status === "overdue")
        .reduce((sum, p) => sum + p.amount, 0); // Use p.amount for overdue
      const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;

      setSummary({
        totalFees: total,
        paidFees: paid,
        pendingFees: pending,
        overdueFees: overdue,
        paidPercentage: percentage,
      });
    } catch (error) {
      console.error("Error loading fee data:", error);
      toast.error("Failed to load fee data");
    } finally {
      setLoading(false);
    }
  };

  const handlePayFee = (payment) => {
    setSelectedPayment(payment);
    setPaymentAmount(payment.amount.toString());
    setPaymentDialogOpen(true);
  };

  const handleDownloadReceipt = (payment) => {
    setReceiptData({
      ...payment,
      studentName: currentUser?.name || "Student Name",
      studentId: currentUser?.id || "STU-2024-001",
      date: new Date().toLocaleDateString(),
    });
    setShowReceipt(true);
  };

  const processPayment = async () => {
    if (!selectedPayment) return;

    const payAmount = parseFloat(paymentAmount);
    if (isNaN(payAmount) || payAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (payAmount > selectedPayment.amount) {
      toast.error("Amount cannot exceed the pending fee");
      return;
    }

    try {
      // Simulate payment processing
      setLoading(true); // briefly show loading state if desired, or just wait
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setPayments((prev) =>
        prev.map((p) => {
          if (p.id === selectedPayment.id) {
            // Check for partial payment logic
            if (p.feeType === "College Fee" && payAmount < p.amount) {
              // Remaining amount
              return {
                ...p,
                amount: p.amount - payAmount,
                receiptUrl: "#", // Generate receipt for partial payment
                transactionId: `TXN${Date.now()}`,
                paidDate: new Date().toISOString().split("T")[0],
              };
            }

            // Full payment
            return {
              ...p,
              amount: 0, // Set pending amount to 0 for full payment
              status: "paid",
              paidDate: new Date().toISOString().split("T")[0],
              paymentMethod: "Online Banking",
              transactionId: `TXN${Date.now()}`,
              receiptUrl: "#",
            };
          }
          return p;
        })
      );

      // Re-fetch logic needs to be careful with mock data state, but since we setPayments directly
      // we don't call loadFeeData() again or it will reset mocks.
      // So we skip loadFeeData() call here to persist the partial change in memory.

      if (selectedPayment.feeType === "College Fee" && payAmount < selectedPayment.amount) {
        toast.success(`Partial payment of ₹${payAmount} successful!`);
      } else {
        toast.success("Payment processed successfully!");
      }

      setPaymentDialogOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-success/10 text-success border-success/20";
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "overdue":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RippleLoader />
      </div>
    );
  }

  const chartData = [
    { name: "Paid", value: summary.paidFees, color: "hsl(var(--success))" },
    { name: "Pending", value: summary.pendingFees, color: "hsl(var(--warning))" },
    { name: "Overdue", value: summary.overdueFees, color: "hsl(var(--destructive))" },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards */}
      {/* Fee Payments List */}

      {/* Fee Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Payments</CardTitle>
          <CardDescription>View and pay your fees</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="pending">Pending/Overdue</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{payment.feeType}</p>
                      <Badge variant="outline" className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {/* ALL Tab shows TOTAL Amount */}
                        {formatCurrency(payment.totalAmount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </span>
                      {payment.paidDate && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Paid: {new Date(payment.paidDate).toLocaleDateString()}
                        </span>
                      )}
                      {payment.transactionId && (
                        <span className="text-xs">TXN: {payment.transactionId}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {payment.receiptUrl && (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDownloadReceipt(payment)}>
                        <Download className="h-4 w-4" />
                        Receipt
                      </Button>
                    )}
                    {(payment.status === "pending" || payment.status === "overdue") && (
                      <Button size="sm" onClick={() => handlePayFee(payment)} className="gap-1.5">
                        <CreditCard className="h-4 w-4" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="paid" className="mt-4 space-y-4">
              {payments
                .filter((p) => p.status === "paid")
                .map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{payment.feeType}</p>
                        <Badge variant="outline" className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {/* PAID Tab shows TOTAL Amount (as they have paid it all) */}
                          {formatCurrency(payment.totalAmount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Paid:{" "}
                          {payment.paidDate && new Date(payment.paidDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {payment.receiptUrl && (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDownloadReceipt(payment)}>
                        <Download className="h-4 w-4" />
                        Receipt
                      </Button>
                    )}
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="pending" className="mt-4 space-y-4">
              {payments
                .filter((p) => p.status === "pending" || p.status === "overdue")
                .map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{payment.feeType}</p>
                        <Badge variant="outline" className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {/* PENDING Tab shows PENDING Amount (payment.amount) */}
                          {formatCurrency(payment.amount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(payment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handlePayFee(payment)} className="gap-1.5">
                      <CreditCard className="h-4 w-4" />
                      Pay Now
                    </Button>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Fee</DialogTitle>
            <DialogDescription>Complete payment for {selectedPayment?.feeType}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                disabled={selectedPayment?.feeType !== "College Fee"}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select defaultValue="online">
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online Banking</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={processPayment} className="w-full gap-2">
              <CreditCard className="h-4 w-4" />
              Process Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center border-b pb-4">Fee Receipt</DialogTitle>
          </DialogHeader>
          {receiptData && (
            <div className="space-y-6 pt-4">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg">SchoolSphere High School</h3>
                <p className="text-xs text-muted-foreground">123 Education Lane, Knowledge City</p>
              </div>

              <div className="space-y-4 text-sm bg-muted/30 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt No:</span>
                  <span className="font-mono">{receiptData.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{receiptData.paidDate || receiptData.date}</span>
                </div>
                <div className="border-t my-2 border-dashed"></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student Name:</span>
                  <span className="font-medium">{receiptData.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee Type:</span>
                  <span>{receiptData.feeType}</span>
                </div>
                <div className="border-t my-2 border-dashed"></div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Amount Paid:</span>
                  <span className="text-primary">{formatCurrency(receiptData.totalAmount - receiptData.amount)}</span>
                  {/* Note: logic for amount paid is total - pending. Or store specific paid amount in transaction history properly. For now deriving it. */}
                </div>
                {receiptData.amount > 0 && (
                  <div className="flex justify-between text-xs text-warning">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(receiptData.amount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-4">
                <Button className="w-full gap-2" onClick={() => {
                  toast.success("Receipt saved to device");
                  setShowReceipt(false);
                }}>
                  <Download className="h-4 w-4" />
                  Download / Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
