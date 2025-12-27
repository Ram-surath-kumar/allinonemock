import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getStaffBreakdown, getStaffGrowthByRole, StaffBreakdown, GrowthStats, PeriodType } from '@/services/dashboard';
import { Loader2, Users, BookOpen, Home, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function StaffBreakdownModal({ open, onOpenChange }: StaffBreakdownModalProps) {
  const [breakdown, setBreakdown] = useState<StaffBreakdown | null>(null);
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'librarian' | 'housekeeping' | 'accountant'>('teacher');
  const [period, setPeriod] = useState<PeriodType>('month');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [loading, setLoading] = useState(false);
  const [growthData, setGrowthData] = useState<GrowthStats | null>(null);
  const [activeTab, setActiveTab] = useState<'breakdown' | 'growth'>('breakdown');

  useEffect(() => {
    if (open) {
      fetchBreakdown();
      if (activeTab === 'growth') {
        fetchGrowthData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab]);

  useEffect(() => {
    if (open && activeTab === 'growth') {
      fetchGrowthData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, period]);

  const fetchBreakdown = async () => {
    try {
      setLoading(true);
      const data = await getStaffBreakdown();
      setBreakdown(data);
    } catch (error) {
      console.error('Error fetching staff breakdown:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrowthData = async () => {
    try {
      setLoading(true);
      const data = await getStaffGrowthByRole(selectedRole, period);
      setGrowthData(data);
    } catch (error) {
      console.error('Error fetching growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = breakdown ? [
    { name: 'Teachers', value: breakdown.teachers, color: COLORS[0] },
    { name: 'Librarians', value: breakdown.librarians, color: COLORS[1] },
    { name: 'Housekeeping', value: breakdown.housekeeping, color: COLORS[2] },
    { name: 'Accountants', value: breakdown.accountants, color: COLORS[3] },
  ].filter(item => item.value > 0) : [];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher':
        return Users;
      case 'librarian':
        return BookOpen;
      case 'housekeeping':
        return Home;
      case 'accountant':
        return Calculator;
      default:
        return Users;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'Teachers';
      case 'librarian':
        return 'Librarians';
      case 'housekeeping':
        return 'Housekeeping';
      case 'accountant':
        return 'Accountants';
      default:
        return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Staff Members Breakdown</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'breakdown' | 'growth')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="growth">Growth Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : breakdown ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <p className="text-sm text-muted-foreground">Teachers</p>
                    </div>
                    <p className="text-2xl font-bold">{breakdown.teachers}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                      <p className="text-sm text-muted-foreground">Librarians</p>
                    </div>
                    <p className="text-2xl font-bold">{breakdown.librarians}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="h-5 w-5 text-amber-600" />
                      <p className="text-sm text-muted-foreground">Housekeeping</p>
                    </div>
                    <p className="text-2xl font-bold">{breakdown.housekeeping}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-5 w-5 text-red-600" />
                      <p className="text-sm text-muted-foreground">Accountants</p>
                    </div>
                    <p className="text-2xl font-bold">{breakdown.accountants}</p>
                  </div>
                </div>

                {/* Pie Chart */}
                {pieData.length > 0 && (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          animationDuration={1000}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="growth" className="space-y-4">
            {/* Role Selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'teacher' | 'librarian' | 'housekeeping' | 'accountant')}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Teachers</SelectItem>
                    <SelectItem value="librarian">Librarians</SelectItem>
                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="accountant">Accountants</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Period:</span>
                <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Chart:</span>
                <Select value={chartType} onValueChange={(v) => setChartType(v as 'line' | 'bar')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats Summary */}
            {growthData && (
              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg border border-border bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current</p>
                  <p className="text-lg font-semibold">{growthData.current}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Previous</p>
                  <p className="text-lg font-semibold">{growthData.previous}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Change</p>
                  <p className={cn(
                    "text-lg font-semibold",
                    growthData.change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {growthData.change >= 0 ? '+' : ''}{growthData.changePercent.toFixed(1)}% from last {period}
                  </p>
                </div>
              </div>
            )}

            {/* Chart */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : growthData && growthData.data.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={growthData.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="label" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                        animationDuration={1000}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={growthData.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="label" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--primary))"
                        radius={[8, 8, 0, 0]}
                        animationDuration={1000}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No data available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

