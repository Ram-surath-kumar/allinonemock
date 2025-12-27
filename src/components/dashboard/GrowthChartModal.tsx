import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getGrowthData, GrowthStats, PeriodType } from '@/services/dashboard';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GrowthChartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  metric: 'students' | 'staff' | 'attendance' | 'fees';
  currentValue: number | string;
  formatValue?: (value: number) => string;
}

export function GrowthChartModal({
  open,
  onOpenChange,
  title,
  metric,
  currentValue,
  formatValue = (v) => v.toString(),
}: GrowthChartModalProps) {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [loading, setLoading] = useState(false);
  const [growthData, setGrowthData] = useState<GrowthStats | null>(null);

  useEffect(() => {
    if (open) {
      fetchGrowthData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, period, metric]);

  const fetchGrowthData = async () => {
    try {
      setLoading(true);
      const data = await getGrowthData(metric, period);
      setGrowthData(data);
    } catch (error) {
      console.error('Error fetching growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeText = () => {
    if (!growthData) return '';
    const sign = growthData.change >= 0 ? '+' : '';
    return `${sign}${growthData.changePercent.toFixed(1)}% from last ${period}`;
  };

  const getChangeType = (): 'positive' | 'negative' | 'neutral' => {
    if (!growthData) return 'neutral';
    return growthData.change >= 0 ? 'positive' : 'negative';
  };

  const chartData = growthData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title} Growth</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
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
              <Select value={chartType} onValueChange={(v) => setChartType(v as 'line' | 'bar' | 'area')}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Summary */}
          {growthData && (
            <div className="grid grid-cols-3 gap-4 p-4 rounded-lg border border-border bg-muted/30">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current</p>
                <p className="text-lg font-semibold">{formatValue(growthData.current)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Previous</p>
                <p className="text-lg font-semibold">{formatValue(growthData.previous)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Change</p>
                <p className={cn(
                  "text-lg font-semibold",
                  getChangeType() === 'positive' && "text-green-600 dark:text-green-400",
                  getChangeType() === 'negative' && "text-red-600 dark:text-red-400"
                )}>
                  {getChangeText()}
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => formatValue(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatValue(value)}
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
                ) : chartType === 'bar' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => formatValue(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatValue(value)}
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
                ) : (
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => formatValue(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatValue(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                      animationDuration={1000}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

