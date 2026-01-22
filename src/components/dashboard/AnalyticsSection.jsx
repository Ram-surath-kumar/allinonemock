import { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, Table } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';



const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export function AnalyticsSection({ data }) {
  const [attendanceView, setAttendanceView] = useState('area');
  const [feeView, setFeeView] = useState('bar');
  const [studentGrowthView, setStudentGrowthView] = useState('line');
  const [todaySummaryView, setTodaySummaryView] = useState('pie');

  // Use passed data or fallbacks to empty arrays to prevent crashes
  const attendanceData = data?.attendance || [];
  const feeData = data?.fees || [];
  const studentGrowthData = data?.students || [];

  const todaySummary = data?.todaySummary || [
    { name: 'Present', value: 0, color: COLORS[1] },
    { name: 'Absent', value: 0, color: COLORS[3] },
  ];

  const renderChartView = (
    data,
    dataKey,
    xAxisKey,
    viewType,
    colors
  ) => {
    if (viewType === 'table') {
      return (
        <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/50">
              <tr>
                <th className="text-left p-2 font-medium text-muted-foreground">{xAxisKey}</th>
                {Object.keys(data[0] || {}).filter(k => k !== xAxisKey).map(key => (
                  <th key={key} className="text-right p-2 font-medium text-muted-foreground capitalize">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-t border-border/50">
                  <td className="p-2 font-medium">{row[xAxisKey]}</td>
                  {Object.keys(row).filter(k => k !== xAxisKey).map(key => (
                    <td key={key} className="text-right p-2 text-muted-foreground">
                      {typeof row[key] === 'number' ? row[key].toLocaleString() : row[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const commonProps = {
      data,
      'aria-label': `${dataKey} chart`,
    };

    if (viewType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
          <XAxis
            dataKey={xAxisKey}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-elevated)',
            }}
            animationDuration={200}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={colors?.primary || "hsl(var(--primary))"}
            strokeWidth={3}
            dot={{ fill: colors?.primary || "hsl(var(--primary))", r: 4 }}
            animationDuration={2000}
            animationBegin={0}
            isAnimationActive={true}
          />
        </LineChart>
      );
    }

    if (viewType === 'bar') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
          <XAxis
            dataKey={xAxisKey}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-elevated)',
            }}
            animationDuration={200}
          />
          <Bar
            dataKey={dataKey}
            fill={colors?.primary || "hsl(var(--primary))"}
            radius={[10, 10, 0, 0]}
            animationDuration={2000}
            animationBegin={200}
            isAnimationActive={true}
          />
        </BarChart>
      );
    }

    if (viewType === 'area') {
      return (
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors?.primary || "hsl(var(--primary))"} stopOpacity={0.4} />
              <stop offset="95%" stopColor={colors?.primary || "hsl(var(--primary))"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
          <XAxis
            dataKey={xAxisKey}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-elevated)',
            }}
            animationDuration={200}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={colors?.primary || "hsl(var(--primary))"}
            strokeWidth={3}
            fillOpacity={1}
            fill={`url(#color${dataKey})`}
            animationDuration={2000}
            animationBegin={0}
            isAnimationActive={true}
          />
        </AreaChart>
      );
    }

    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* Attendance Chart */}
      <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-3.5 shadow-depth-2 hover:shadow-depth-3 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 glass-modern" role="region" aria-label="Attendance Trend Chart">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-sm bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Attendance Trend</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {attendanceView === 'line' && <LineChartIcon className="h-4 w-4" />}
                {attendanceView === 'bar' && <BarChart3 className="h-4 w-4" />}
                {attendanceView === 'area' && <AreaChartIcon className="h-4 w-4" />}
                {attendanceView === 'table' && <Table className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setAttendanceView('line')}>
                <LineChartIcon className="mr-2 h-4 w-4" />
                Line Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAttendanceView('bar')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Bar Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAttendanceView('area')}>
                <AreaChartIcon className="mr-2 h-4 w-4" />
                Area Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAttendanceView('table')}>
                <Table className="mr-2 h-4 w-4" />
                Table View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {attendanceView === 'table' ? (
          renderChartView(attendanceData, 'attendance', 'day', 'table')
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            {renderChartView(attendanceData, 'attendance', 'day', attendanceView, { primary: 'hsl(var(--primary))' })}
          </ResponsiveContainer>
        )}
      </div>

      {/* Fee Trend */}
      <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-3.5 shadow-depth-2 hover:shadow-depth-3 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 glass-modern" role="region" aria-label="Fee Collection Chart">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-sm bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Fee Collection</h3>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {feeView === 'line' && <LineChartIcon className="h-4 w-4" />}
                {feeView === 'bar' && <BarChart3 className="h-4 w-4" />}
                {feeView === 'area' && <AreaChartIcon className="h-4 w-4" />}
                {feeView === 'table' && <Table className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFeeView('line')}>
                <LineChartIcon className="mr-2 h-4 w-4" />
                Line Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFeeView('bar')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Bar Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFeeView('area')}>
                <AreaChartIcon className="mr-2 h-4 w-4" />
                Area Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFeeView('table')}>
                <Table className="mr-2 h-4 w-4" />
                Table View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {feeView === 'table' ? (
          renderChartView(feeData, 'collected', 'month', 'table')
        ) : feeView === 'bar' ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={feeData} aria-label="Fee collection over last 6 months">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-elevated)',
                }}
                animationDuration={200}
              />
              <Bar
                dataKey="collected"
                fill="hsl(var(--success))"
                radius={[10, 10, 0, 0]}
                animationDuration={2000}
                animationBegin={200}
                isAnimationActive={true}
              />
              <Bar
                dataKey="pending"
                fill="hsl(var(--warning))"
                radius={[10, 10, 0, 0]}
                animationDuration={2000}
                animationBegin={400}
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            {renderChartView(feeData, 'collected', 'month', feeView, { primary: 'hsl(var(--success))' })}
          </ResponsiveContainer>
        )}
      </div>

      {/* Student Growth */}
      <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-3.5 shadow-depth-2 hover:shadow-depth-3 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 glass-modern" role="region" aria-label="Student Growth Chart">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-sm bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Student Growth</h3>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {studentGrowthView === 'line' && <LineChartIcon className="h-4 w-4" />}
                {studentGrowthView === 'bar' && <BarChart3 className="h-4 w-4" />}
                {studentGrowthView === 'area' && <AreaChartIcon className="h-4 w-4" />}
                {studentGrowthView === 'table' && <Table className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStudentGrowthView('line')}>
                <LineChartIcon className="mr-2 h-4 w-4" />
                Line Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStudentGrowthView('bar')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Bar Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStudentGrowthView('area')}>
                <AreaChartIcon className="mr-2 h-4 w-4" />
                Area Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStudentGrowthView('table')}>
                <Table className="mr-2 h-4 w-4" />
                Table View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {studentGrowthView === 'table' ? (
          renderChartView(studentGrowthData, 'students', 'month', 'table')
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            {renderChartView(studentGrowthData, 'students', 'month', studentGrowthView, { primary: 'hsl(var(--primary))' })}
          </ResponsiveContainer>
        )}
      </div>

      {/* Today Summary */}
      <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-3.5 shadow-depth-2 hover:shadow-depth-3 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 glass-modern" role="region" aria-label="Today Summary Chart">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-sm bg-gradient-to-br from-pink-500/20 to-pink-600/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Today Summary</h3>
              <p className="text-xs text-muted-foreground">Attendance overview</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {todaySummaryView === 'pie' && <TrendingUp className="h-4 w-4" />}
                {todaySummaryView === 'table' && <Table className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTodaySummaryView('pie')}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Pie Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTodaySummaryView('table')}>
                <Table className="mr-2 h-4 w-4" />
                Table View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {todaySummaryView === 'table' ? (
          <div className="space-y-2">
            {todaySummary.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart aria-label="Today's attendance summary">
                  <Pie
                    data={todaySummary}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={2000}
                    animationBegin={0}
                    isAnimationActive={true}
                  >
                    {todaySummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-elevated)',
                    }}
                    animationDuration={200}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              {todaySummary.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
