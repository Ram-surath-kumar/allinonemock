import { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, DollarSign, Users, ArrowUpRight, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function Finance() {
  const { currentUser } = useAuth();
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const response = await api.getFinanceData(currentUser?.id, currentUser?.role);
      if (response.error) throw new Error(response.error);
      
      if (response.data) {
        setFinanceData(response.data);
      }
    } catch (error) {
      console.error('Error loading finance data:', error);
      toast.error('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const data = financeData || {
    totalIncome: 0,
    totalSalaryPaid: 0,
    netProfit: 0,
    careerGrowth: [],
    promotions: [],
    hikeRate: { averageHikeRate: 0, totalHikes: 0, hikes: [] },
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
          <CardHeader className="p-4 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Total Income</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.totalIncome)}</p>
            <p className="text-xs text-muted-foreground mt-1">From fees and payments</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
          <CardHeader className="p-4 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Salary Paid</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.totalSalaryPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total staff salaries</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
          <CardHeader className="p-4 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Net Profit</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.netProfit)}</p>
            <p className="text-xs text-muted-foreground mt-1">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Career Growth Section */}
      <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Career Growth</CardTitle>
          </div>
          <CardDescription>Staff career progression and growth metrics</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {data.careerGrowth.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No career growth data available
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Current Salary</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Promotions</TableHead>
                    <TableHead>Hikes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.careerGrowth.map((staff) => (
                    <TableRow key={staff.userId}>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{staff.role}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(staff.currentSalary)}</TableCell>
                      <TableCell>{formatDate(staff.joinDate)}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {staff.promotions}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                          {staff.hikes}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promotion Details Section */}
      <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Promotion Details</CardTitle>
          </div>
          <CardDescription>Recent staff promotions and role changes</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {data.promotions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No promotion records available
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>From Role</TableHead>
                    <TableHead>To Role</TableHead>
                    <TableHead>Promotion Date</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.promotions.map((promo, index) => (
                    <TableRow key={promo.id || index}>
                      <TableCell className="font-medium">
                        {promo.user_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{promo.from_role || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                          {promo.to_role || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(promo.promotion_date)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {promo.reason || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hike Rate Section */}
      <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Salary Hike Rate</CardTitle>
          </div>
          <CardDescription>Average hike rate and individual salary increments</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-muted/20">
              <p className="text-sm text-muted-foreground">Average Hike Rate</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {data.hikeRate.averageHikeRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-muted/20">
              <p className="text-sm text-muted-foreground">Total Hikes</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {data.hikeRate.totalHikes}
              </p>
            </div>
          </div>

          {data.hikeRate.hikes.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No hike records available
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Hike Percentage</TableHead>
                    <TableHead>Previous Salary</TableHead>
                    <TableHead>New Salary</TableHead>
                    <TableHead>Hike Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.hikeRate.hikes.map((hike, index) => (
                    <TableRow key={hike.id || index}>
                      <TableCell className="font-medium">
                        {hike.user_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                          +{hike.hike_percentage?.toFixed(1) || '0'}%
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(hike.previous_salary || 0)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(hike.new_salary || 0)}
                      </TableCell>
                      <TableCell>{formatDate(hike.hike_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
