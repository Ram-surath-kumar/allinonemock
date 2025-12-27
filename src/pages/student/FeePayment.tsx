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

interface FeePayment {
  id: string;
  feeType: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod?: string;
  transactionId?: string;
  receiptUrl?: string;
}

interface PaymentSummary {
  totalFees: number;
  paidFees: number;
  pendingFees: number;
  overdueFees: number;
  paidPercentage: number;
}

export function FeePayment() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalFees: 0,
    paidFees: 0,
    pendingFees: 0,
    overdueFees: 0,
    paidPercentage: 0,
  });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);
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
      const mockPayments: FeePayment[] = [
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
      const paid = mockPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      const pending = mockPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
      const overdue = mockPayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
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

  const handlePayFee = (payment: FeePayment) => {
    setSelectedPayment(payment);
    setPaymentAmount(payment.amount.toString());
    setPaymentDialogOpen(true);
  };

  const processPayment = async () => {
    if (!selectedPayment) return;

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update payment status
      setPayments(prev =>
        prev.map(p =>
          p.id === selectedPayment.id
            ? {
                ...p,
                status: 'paid' as const,
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

  const getStatusColor = (status: string) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const chartData = [
    { name: 'Paid', value: summary.paidFees, color: 'hsl(var(--success))' },
    { name: 'Pending', value: summary.pendingFees, color: 'hsl(var(--warning))' },
    { name: 'Overdue', value: summary.overdueFees, color: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Fees</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalFees)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-xl font-bold text-success">{formatCurrency(summary.paidFees)}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-warning">{formatCurrency(summary.pendingFees)}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Payment Status</p>
                <p className="text-xl font-bold">{summary.paidPercentage}%</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Chart */}
      <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
        <CardHeader className="p-3.5 pb-3">
          <CardTitle className="text-base">Payment Overview</CardTitle>
          <CardDescription>Fee payment distribution</CardDescription>
        </CardHeader>
        <CardContent className="p-3.5 pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fee Payments List */}
      <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
        <CardHeader className="p-3.5 pb-3">
          <CardTitle className="text-base">Fee Payments</CardTitle>
          <CardDescription>View and pay your fees</CardDescription>
        </CardHeader>
        <CardContent className="p-3.5 pt-0">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="pending">Pending/Overdue</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-3 space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-semibold">{payment.feeType}</p>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-medium">{formatCurrency(payment.amount)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {new Date(payment.dueDate).toLocaleDateString()}</span>
                        </div>
                        {payment.paidDate && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Paid: {new Date(payment.paidDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {payment.transactionId && (
                          <div className="flex items-center gap-1.5">
                            <span>TXN: {payment.transactionId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {payment.status === 'paid' && payment.receiptUrl && (
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Download className="h-3 w-3" />
                          Receipt
                        </Button>
                      )}
                      {(payment.status === 'pending' || payment.status === 'overdue') && (
                        <Button
                          size="sm"
                          onClick={() => handlePayFee(payment)}
                          className="gap-1.5"
                        >
                          <CreditCard className="h-3 w-3" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="paid" className="mt-3 space-y-2">
              {payments.filter(p => p.status === 'paid').map((payment) => (
                <div
                  key={payment.id}
                  className="p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-semibold">{payment.feeType}</p>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-medium">{formatCurrency(payment.amount)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Paid: {payment.paidDate && new Date(payment.paidDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {payment.receiptUrl && (
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Download className="h-3 w-3" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="pending" className="mt-3 space-y-2">
              {payments.filter(p => p.status === 'pending' || p.status === 'overdue').map((payment) => (
                <div
                  key={payment.id}
                  className="p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-semibold">{payment.feeType}</p>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-medium">{formatCurrency(payment.amount)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {new Date(payment.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handlePayFee(payment)}
                      className="gap-1.5"
                    >
                      <CreditCard className="h-3 w-3" />
                      Pay Now
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Fee</DialogTitle>
            <DialogDescription>
              Complete payment for {selectedPayment?.feeType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                disabled
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
            <Button
              onClick={processPayment}
              className="w-full"
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Process Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

