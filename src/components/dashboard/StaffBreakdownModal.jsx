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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getStaffBreakdown, getStaffGrowthByRole } from "@/services/dashboard";
import { Loader2, Users, BookOpen, Home, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function StaffBreakdownModal({ open, onOpenChange }) {
  const [breakdown, setBreakdown] = useState(null);
  const [selectedRole, setSelectedRole] = useState("teacher");
  const [period, setPeriod] = useState("month");
  const [chartType, setChartType] = useState("line");
  const [loading, setLoading] = useState(false);
  const [growthData, setGrowthData] = useState(null);
  const [activeTab, setActiveTab] = useState("breakdown");

  useEffect(() => {
    if (open) {
      fetchBreakdown();
      if (activeTab === "growth") {
        fetchGrowthData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab]);

  useEffect(() => {
    if (open && activeTab === "growth") {
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
      console.error("Error fetching staff breakdown:", error);
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
      console.error("Error fetching growth data:", error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = breakdown
    ? [
        { name: "Teachers", value: breakdown.teacher || breakdown.teachers || 0, color: COLORS[0] },
        {
          name: "Librarians",
          value: breakdown.librarian || breakdown.librarians || 0,
          color: COLORS[1],
        },
        { name: "Housekeeping", value: breakdown.housekeeping || 0, color: COLORS[2] },
        {
          name: "Accountants",
          value: breakdown.accountant || breakdown.accountants || 0,
          color: COLORS[3],
        },
      ].filter((item) => item.value > 0)
    : [];

  // Calculate total for center label
  const totalStaff = pieData.reduce((sum, item) => sum + item.value, 0);

  // Add percentage to each item
  const pieDataWithPercent = pieData.map((item) => ({
    ...item,
    percent: totalStaff > 0 ? ((item.value / totalStaff) * 100).toFixed(1) : 0,
  }));

  const getRoleIcon = (role) => {
    switch (role) {
      case "teacher":
        return Users;
      case "librarian":
        return BookOpen;
      case "housekeeping":
        return Home;
      case "accountant":
        return Calculator;
      default:
        return Users;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "teacher":
        return "Teachers";
      case "librarian":
        return "Librarians";
      case "housekeeping":
        return "Housekeeping";
      case "accountant":
        return "Accountants";
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

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            if (v === "growth" && !growthData) {
              fetchGrowthData();
            }
          }}
          className="w-full"
        >
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
                    <p className="text-2xl font-bold">
                      {breakdown.teacher || breakdown.teachers || 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                      <p className="text-sm text-muted-foreground">Librarians</p>
                    </div>
                    <p className="text-2xl font-bold">
                      {breakdown.librarian || breakdown.librarians || 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="h-5 w-5 text-amber-600" />
                      <p className="text-sm text-muted-foreground">Housekeeping</p>
                    </div>
                    <p className="text-2xl font-bold">{breakdown.housekeeping || 0}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-5 w-5 text-red-600" />
                      <p className="text-sm text-muted-foreground">Accountants</p>
                    </div>
                    <p className="text-2xl font-bold">
                      {breakdown.accountant || breakdown.accountants || 0}
                    </p>
                  </div>
                </div>

                {/* Enhanced Donut Chart */}
                {pieDataWithPercent.length > 0 && (
                  <div className="w-full space-y-6">
                    <div className="relative h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            {pieDataWithPercent.map((entry, index) => (
                              <filter
                                key={`shadow-${index}`}
                                id={`shadow-${index}`}
                                x="-50%"
                                y="-50%"
                                width="200%"
                                height="200%"
                              >
                                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                                <feOffset dx="2" dy="2" result="offsetblur" />
                                <feComponentTransfer>
                                  <feFuncA type="linear" slope="0.3" />
                                </feComponentTransfer>
                                <feMerge>
                                  <feMergeNode />
                                  <feMergeNode in="SourceGraphic" />
                                </feMerge>
                              </filter>
                            ))}
                          </defs>
                          <Pie
                            data={pieDataWithPercent}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            innerRadius={70}
                            fill="#8884d8"
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1000}
                            animationEasing="ease-out"
                            paddingAngle={3}
                            cornerRadius={8}
                          >
                            {pieDataWithPercent.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke="hsl(var(--background))"
                                strokeWidth={2}
                                style={{
                                  filter: `drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))`,
                                  transition: "opacity 0.3s",
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.opacity = 0.8;
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.opacity = 1;
                                }}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-card border border-border rounded-lg shadow-lg p-3">
                                    <p className="font-semibold text-foreground mb-1">
                                      {data.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      <span className="font-medium text-foreground">
                                        {data.value}
                                      </span>{" "}
                                      staff members
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {data.percent}% of total
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          {/* Center Label */}
                          <text
                            x="50%"
                            y="45%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-3xl font-bold fill-foreground"
                          >
                            {totalStaff}
                          </text>
                          <text
                            x="50%"
                            y="55%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-sm fill-muted-foreground"
                          >
                            Total Staff
                          </text>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Enhanced Legend */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {pieDataWithPercent.map((entry, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                        >
                          <div
                            className="h-4 w-4 rounded-sm shrink-0 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: entry.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {entry.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-lg font-bold text-foreground">
                                {entry.value}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({entry.percent}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v)}>
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
                <Select value={period} onValueChange={(v) => setPeriod(v)}>
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
                <Select value={chartType} onValueChange={(v) => setChartType(v)}>
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
                  <p className="text-lg font-semibold">
                    {growthData.currentValue !== undefined
                      ? growthData.currentValue
                      : growthData.current || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Previous</p>
                  <p className="text-lg font-semibold">
                    {growthData.previousValue !== undefined
                      ? growthData.previousValue
                      : growthData.previous || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Change</p>
                  <p
                    className={cn(
                      "text-lg font-semibold",
                      (growthData.change !== undefined ? growthData.change : 0) >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {(growthData.change !== undefined ? growthData.change : 0) >= 0 ? "+" : ""}
                    {growthData.changePercent ? growthData.changePercent.toFixed(1) : "0.0"}% from
                    last {period}
                  </p>
                </div>
              </div>
            )}

            {/* Chart */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : growthData && (growthData.dataPoints || growthData.data || []).length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "line" ? (
                    <LineChart data={growthData.dataPoints || growthData.data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
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
                  ) : (
                    <BarChart data={growthData.dataPoints || growthData.data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
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
