import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getGrowthData } from "@/services/dashboard";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function GrowthChartModal({
  open,
  onOpenChange,
  title,
  metric,
  currentValue,
  formatValue = (v) => v.toString(),
}) {
  const [period, setPeriod] = useState("month");
  const [chartType, setChartType] = useState("line");
  const [loading, setLoading] = useState(false);
  const [growthData, setGrowthData] = useState(null);

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
      console.error("Error fetching growth data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeText = () => {
    if (!growthData) return "";
    const change =
      growthData.change !== undefined ? growthData.change : growthData.changeValue || 0;
    const changePercent =
      growthData.changePercent !== undefined
        ? growthData.changePercent
        : growthData.changePercent || 0;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${changePercent.toFixed(1)}% from last ${period}`;
  };

  const getChangeType = () => {
    if (!growthData) return "neutral";
    const change =
      growthData.change !== undefined ? growthData.change : growthData.changeValue || 0;
    return change >= 0 ? "positive" : "negative";
  };

  // Map API response to component expectations
  // API returns: currentValue, previousValue, dataPoints
  // Component expects: current, previous, data
  const current =
    growthData?.currentValue !== undefined ? growthData.currentValue : growthData?.current || 0;
  const previous =
    growthData?.previousValue !== undefined ? growthData.previousValue : growthData?.previous || 0;
  const chartData = growthData?.dataPoints || growthData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{title} Growth</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Period:</span>
              <Select value={period} onValueChange={(v) => setPeriod(v)}>
                <SelectTrigger className="w-40">
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
              <span className="text-sm font-medium">Chart:</span>
              <Select value={chartType} onValueChange={(v) => setChartType(v)}>
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
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Current</p>
                <p className="text-2xl font-bold">{formatValue(current)}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Previous</p>
                <p className="text-2xl font-bold">{formatValue(previous)}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Change</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    getChangeType() === "positive" && "text-green-600 dark:text-green-400",
                    getChangeType() === "negative" && "text-red-600 dark:text-red-400"
                  )}
                >
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
                {chartType === "line" ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => formatValue(value)}
                    />
                    <Tooltip
                      formatter={(value) => formatValue(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      animationDuration={1000}
                    />
                  </LineChart>
                ) : chartType === "bar" ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => formatValue(value)}
                    />
                    <Tooltip
                      formatter={(value) => formatValue(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
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
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => formatValue(value)}
                    />
                    <Tooltip
                      formatter={(value) => formatValue(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      animationDuration={1000}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>No data available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
