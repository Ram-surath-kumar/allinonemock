import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { IndianRupee, CreditCard, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function FinanceDashboard() {
    const { currentUser } = useAuth();
    const [data, setData] = useState({
        totalIncome: 0,
        totalSalaryPaid: 0,
        netProfit: 0
    });

    useEffect(() => {
        const loadData = async () => {
            // Fetch financial statements (Income, Expense, etc.)
            const res = await api.getFinancialStatements();
            if (res.data) {
                setData({
                    totalIncome: res.data.income || 0,
                    totalSalaryPaid: res.data.expense || 0, // Using expense as salary for now
                    netProfit: (res.data.income || 0) - (res.data.expense || 0)
                });
            }
        };
        loadData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.totalIncome)}</div>
                    <p className="text-xs text-muted-foreground">Total revenue collected</p>
                </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Salary Paid</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.totalSalaryPaid)}</div>
                    <p className="text-xs text-muted-foreground">Total salaries disbursed</p>
                </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.netProfit)}</div>
                    <p className="text-xs text-muted-foreground">Income - Expenses</p>
                </CardContent>
            </Card>
        </div>
    );
}
