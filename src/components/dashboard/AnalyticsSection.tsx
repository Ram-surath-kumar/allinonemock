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
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sample data generators
const generateAttendanceData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    attendance: Math.floor(Math.random() * 20) + 80,
  }));
};

const generateFeeData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    collected: Math.floor(Math.random() * 50000) + 200000,
    pending: Math.floor(Math.random() * 30000) + 50000,
  }));
};

const generateStudentGrowthData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    students: Math.floor(Math.random() * 100) + 2800,
  }));
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export function AnalyticsSection() {
  const attendanceData = generateAttendanceData();
  const feeData = generateFeeData();
  const studentGrowthData = generateStudentGrowthData();
  
  const todaySummary = [
    { name: 'Present', value: 2680, color: COLORS[1] },
    { name: 'Absent', value: 167, color: COLORS[3] },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Attendance Chart */}
      <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-5 shadow-depth-2 hover:shadow-depth-3 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 glass-modern" role="region" aria-label="Attendance Trend Chart">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Attendance Trend</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={attendanceData} aria-label="Attendance trend over last 7 days">
            <defs>
              <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
            <XAxis 
              dataKey="day" 
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
              dataKey="attendance" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAttendance)"
              animationDuration={2000}
              animationBegin={0}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Fee Trend */}
      <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-5 shadow-depth-2 hover:shadow-depth-3 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 glass-modern" role="region" aria-label="Fee Collection Chart">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Fee Collection</h3>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
          </div>
        </div>
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
      </div>

      {/* Student Growth */}
      <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-5 shadow-depth-2 hover:shadow-depth-3 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 glass-modern" role="region" aria-label="Student Growth Chart">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Student Growth</h3>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={studentGrowthData} aria-label="Student growth over last 6 months">
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
            <Line 
              type="monotone" 
              dataKey="students" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3.5}
              dot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 2 }}
              animationDuration={2000}
              animationBegin={0}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Today Summary */}
      <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-5 shadow-depth-2 hover:shadow-depth-3 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 glass-modern" role="region" aria-label="Today Summary Chart">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-pink-600/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Today Summary</h3>
              <p className="text-xs text-muted-foreground">Attendance overview</p>
            </div>
          </div>
        </div>
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
      </div>
    </div>
  );
}

