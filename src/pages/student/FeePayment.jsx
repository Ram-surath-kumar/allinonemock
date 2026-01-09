import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, CheckCircle2, XCircle, Calendar, Download, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  const [paymentAmount, setPaymentAmount] = useState('');

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
          id: '1',
          feeType: 'Tuition Fee',
          amount: 50000,
          dueDate: '2024-12-15',
          paidDate: '2024-12-10',
          status: 'paid',
          paymentMethod: 'Online Banking',
          transactionId: 'TXN123456',
          receiptUrl: '#',
        },
        {
          id: '2',
          feeType: 'Library Fee',
          amount: 2000,
          dueDate: '2024-12-20',
          status: 'pending',
        },
        {
          id: '3',
          feeType: 'Lab Fee',
          amount: 5000,
          dueDate: '2024-11-30',
          status: 'overdue',
        },
        {
          id: '4',
          feeType: 'Examination Fee',
          amount: 3000,
          dueDate: '2025-01-15',
          status: 'pending',
        },
      ];

      setPayments(mockPayments);

      // Calculate summary
      const total = mockPayments.reduce((sum, p) => sum + p.amount, 0);
      const paid = mockPayments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      const pending = mockPayments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
      const overdue = mockPayments.filter((p) => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
      const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;

      setSummary({
        totalFees: total,
        paidFees: paid,
        pendingFees: pending,
        overdueFees: overdue,
        paidPercentage: percentage,
      });
    } catch (error) {
      console.error('Error loading fee data:', error);
      toast.error('Failed to load fee data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayFee = (payment) => {
    setSelectedPayment(payment);
    setPaymentAmount(payment.amount.toString());
    setPaymentDialogOpen(true);
  };

  const processPayment = async () => {
    if (!selectedPayment) return;

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update payment status
      setPayments((prev) =>
        prev.map((p) =>
          p.id === selectedPayment.id
            ? {
                ...p,
                status: 'paid',
                paidDate: new Date().toISOString().split('T')[0],
                paymentMethod: 'Online Banking',
                transactionId: `TXN${Date.now()}`,
              }
            : p
        )
      );

      toast.success('Payment processed successfully!');
      setPaymentDialogOpen(false);
      setSelectedPayment(null);
      loadFeeData();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'overdue':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const chartData = [
    { name: 'Paid', value: summary.paidFees, color: 'hsl(var(--success))' },
    { name: 'Pending', value: summary.pendingFees, color: 'hsl(var(--warning))' },
    { name: 'Overdue', value: summary.overdueFees, color: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalFees)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(summary.paidFees)}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(summary.pendingFees)}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <p className="text-2xl font-bold">{summary.paidPercentage}%</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Overview</CardTitle>
          <CardDescription>Fee payment distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="value" name="Amount">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

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
                <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
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
                        {formatCurrency(payment.amount)}
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
                        <span className="text-xs">
                          TXN: {payment.transactionId}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {payment.status === 'paid' && payment.receiptUrl && (
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="h-4 w-4" />
                        Receipt
                      </Button>
                    )}
                    {(payment.status === 'pending' || payment.status === 'overdue') && (
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
                .filter((p) => p.status === 'paid')
                .map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
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
                          {formatCurrency(payment.amount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Paid: {payment.paidDate && new Date(payment.paidDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {payment.receiptUrl && (
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="h-4 w-4" />
                        Receipt
                      </Button>
                    )}
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="pending" className="mt-4 space-y-4">
              {payments
                .filter((p) => p.status === 'pending' || p.status === 'overdue')
                .map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
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
            <DialogDescription>
              Complete payment for {selectedPayment?.feeType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} disabled />
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
    </div>
  );
}
