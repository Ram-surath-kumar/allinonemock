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
    totalFees,
    paidFees,
    pendingFees,
    overdueFees,
    paidPercentage);
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
      const mockPayments= [
        {
          id: '1',
          feeType: 'Tuition Fee',
          amount,
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
          amount,
          dueDate: '2024-12-20',
          status: 'pending',
        },
        {
          id: '3',
          feeType: 'Lab Fee',
          amount,
          dueDate: '2024-11-30',
          status: 'overdue',
        },
        {
          id: '4',
          feeType: 'Examination Fee',
          amount,
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
      const percentage = total > 0 ? Math.round((paid / total) * 100) ;

      setSummary({
        totalFees,
        paidFees,
        pendingFees,
        overdueFees,
        paidPercentage);
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
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update payment status
      setPayments(prev =>
        prev.map(p =>
          p.id === selectedPayment.id
            ? {
                ...p,
                status: 'paid': new Date().toISOString().split('T')[0],
                paymentMethod: 'Online Banking',
                transactionId: `TXN${Date.now()}`,
              }
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
      maximumFractionDigits).format(amount);
  };

  if (loading) {
    return (
      
        
        
      
    );
  }

  const chartData = [
    { name: 'Paid', value: summary.paidFees, color: 'hsl(var(--success))' },
    { name: 'Pending', value: summary.pendingFees, color: 'hsl(var(--warning))' },
    { name: 'Overdue', value: summary.overdueFees, color: 'hsl(var(--destructive))' },
  ];

  return (
    
      {/* Summary Cards */}
      
        
          
            
              
                Total Fees
                {formatCurrency(summary.totalFees)}
              
              
            
          
        

        
          
            
              
                Paid
                {formatCurrency(summary.paidFees)}
              
              
            
          
        

        
          
            
              
                Pending
                {formatCurrency(summary.pendingFees)}
              
              
            
          
        

        
          
            
              
                Payment Status
                {summary.paidPercentage}%
              
              
            
          
        
      

      {/* Payment Chart */}
      
        
          Payment Overview
          Fee payment distribution
        
        
          
            
              
              
              
               formatCurrency(value)} />
              
                {chartData.map((entry, index) => (
                  
                ))}
              
            
          
        
      

      {/* Fee Payments List */}
      
        
          Fee Payments
          View and pay your fees
        
        
          
            
              All
              Paid
              Pending/Overdue
            

            
              {payments.map((payment) => (
                
                  
                    
                      
                        {payment.feeType}
                        
                          {payment.status}
                        
                      
                      
                        
                          
                          {formatCurrency(payment.amount)}
                        
                        
                          
                          Due{new Date(payment.dueDate).toLocaleDateString()}
                        
                        {payment.paidDate && (
                          
                            
                            Paid{new Date(payment.paidDate).toLocaleDateString()}
                          
                        )}
                        {payment.transactionId && (
                          
                            TXN{payment.transactionId}
                          
                        )}
                      
                    
                    
                      {payment.status === 'paid' && payment.receiptUrl && (
                        
                          
                          Receipt
                        
                      )}
                      {(payment.status === 'pending' || payment.status === 'overdue') && (
                         handlePayFee(payment)}
                          className="gap-1.5"
                        >
                          
                          Pay Now
                        
                      )}
                    
                  
                
              ))}
            

            
              {payments.filter(p => p.status === 'paid').map((payment) => (
                
                  
                    
                      
                        {payment.feeType}
                        
                          {payment.status}
                        
                      
                      
                        
                          
                          {formatCurrency(payment.amount)}
                        
                        
                          
                          Paid{payment.paidDate && new Date(payment.paidDate).toLocaleDateString()}
                        
                      
                    
                    {payment.receiptUrl && (
                      
                        
                        Receipt
                      
                    )}
                  
                
              ))}
            

            
              {payments.filter(p => p.status === 'pending' || p.status === 'overdue').map((payment) => (
                
                  
                    
                      
                        {payment.feeType}
                        
                          {payment.status}
                        
                      
                      
                        
                          
                          {formatCurrency(payment.amount)}
                        
                        
                          
                          Due{new Date(payment.dueDate).toLocaleDateString()}
                        
                      
                    
                     handlePayFee(payment)}
                      className="gap-1.5"
                    >
                      
                      Pay Now
                    
                  
                
              ))}
            
          
        
      

      {/* Payment Dialog */}
      
        
          
            Pay Fee
            
              Complete payment for {selectedPayment?.feeType}
            
          
          
            
              Amount
               setPaymentAmount(e.target.value)}
                disabled
              />
            
            
              Payment Method
              
                
                  
                
                
                  Online Banking
                  Credit/Debit Card
                  UPI
                
              
            
            
              
              Process Payment
            
          
        
      
    
  );
}

