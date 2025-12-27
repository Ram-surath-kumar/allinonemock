import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  gradient?: string;
  sparklineData?: number[];
  showChart?: boolean;
  onClick?: () => void;
}

// Generate sample sparkline data if not provided
const generateSparklineData = (): number[] => {
  const data = [];
  const base = Math.random() * 50 + 50;
  for (let i = 0; i < 7; i++) {
    data.push(Math.max(0, base + (Math.random() - 0.5) * 20));
  }
  return data;
};

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon, 
  iconColor,
  gradient = 'from-blue-500/20 via-purple-500/20 to-pink-500/20',
  sparklineData,
  showChart = true,
  onClick,
  ...props 
}: StatsCardProps & { style?: React.CSSProperties }) {
  const chartData = sparklineData || generateSparklineData();
  const formattedData = chartData.map((val, idx) => ({ value: val, index: idx }));

  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  // Determine card color theme based on gradient
  const getCardTheme = () => {
    if (gradient.includes('blue')) {
      return {
        iconBg: 'bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
        hoverGradient: 'from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-500/10 dark:via-indigo-500/8 dark:to-purple-500/10',
        hoverBorder: 'border-blue-200/50 dark:border-blue-500/30',
        hoverGlow: 'bg-blue-400/30',
        chartColor: 'hsl(217, 91%, 60%)',
      };
    } else if (gradient.includes('green')) {
      return {
        iconBg: 'bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        hoverGradient: 'from-emerald-50/80 via-teal-50/60 to-cyan-50/80 dark:from-emerald-500/10 dark:via-teal-500/8 dark:to-cyan-500/10',
        hoverBorder: 'border-emerald-200/50 dark:border-emerald-500/30',
        hoverGlow: 'bg-emerald-400/30',
        chartColor: 'hsl(160, 84%, 39%)',
      };
    } else if (gradient.includes('yellow') || gradient.includes('orange')) {
      return {
        iconBg: 'bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20',
        iconColor: 'text-amber-600 dark:text-amber-400',
        hoverGradient: 'from-amber-50/80 via-orange-50/60 to-yellow-50/80 dark:from-amber-500/10 dark:via-orange-500/8 dark:to-yellow-500/10',
        hoverBorder: 'border-amber-200/50 dark:border-amber-500/30',
        hoverGlow: 'bg-amber-400/30',
        chartColor: 'hsl(43, 96%, 56%)',
      };
    } else if (gradient.includes('purple') || gradient.includes('pink')) {
      return {
        iconBg: 'bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-rose-500/20',
        iconColor: 'text-purple-600 dark:text-purple-400',
        hoverGradient: 'from-purple-50/80 via-pink-50/60 to-rose-50/80 dark:from-purple-500/10 dark:via-pink-500/8 dark:to-rose-500/10',
        hoverBorder: 'border-purple-200/50 dark:border-purple-500/30',
        hoverGlow: 'bg-purple-400/30',
        chartColor: 'hsl(270, 91%, 65%)',
      };
    }
    return {
      iconBg: 'bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10',
      iconColor: 'text-primary',
      hoverGradient: 'from-primary/10 via-primary/8 to-primary/10',
      hoverBorder: 'border-primary/30',
      hoverGlow: 'bg-primary/20',
      chartColor: 'hsl(var(--primary))',
    };
  };

  const theme = getCardTheme();

  return (
    <div 
      className={cn(
        "group relative rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-3.5",
        "shadow-depth-2 hover:shadow-depth-3 transition-all duration-300",
        "hover:scale-[1.02] hover:-translate-y-0.5",
        "overflow-hidden animate-fade-in-up",
        onClick ? "cursor-pointer" : "",
        "glass-modern",
        `hover:${theme.hoverBorder}`
      )}
      style={props.style}
      role="article"
      aria-label={`${title}: ${value}`}
      onClick={onClick}
    >
      {/* Subtle Gradient Background on Hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        `bg-gradient-to-br ${theme.hoverGradient}`
      )} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1.5" aria-label={title}>{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground mb-1" aria-label={`Value: ${value}`}>
              {value}
            </p>
          {change && (
              <div className="flex items-center gap-1.5 mt-1.5" aria-label={`Change: ${change}`}>
                {isPositive && <TrendingUp className="h-3.5 w-3.5 text-success" aria-hidden="true" />}
                {isNegative && <TrendingDown className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />}
                <span className={cn(
                  "text-xs sm:text-sm font-semibold",
                  isPositive && "text-success",
                  isNegative && "text-destructive",
              changeType === 'neutral' && "text-muted-foreground"
            )}>
              {change}
                </span>
              </div>
          )}
          </div>
          
          {/* Animated Icon */}
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            "transition-all duration-300 group-hover:scale-110 shrink-0",
            "shadow-md",
            iconColor || theme.iconBg
          )} aria-hidden="true">
            <Icon className={cn(
              "h-6 w-6 transition-transform duration-300",
              iconColor ? "text-current" : theme.iconColor
            )} />
          </div>
        </div>

        {/* Sparkline Chart */}
        {showChart && (
          <div className="mt-4 h-[36px] w-full" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? theme.chartColor : isNegative ? "hsl(var(--destructive))" : theme.chartColor}
                  strokeWidth={2.5}
                  dot={false}
                  animationDuration={1500}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Subtle Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none">
        <div className={cn(
          "absolute inset-0 rounded-2xl blur-2xl",
          theme.hoverGlow
        )} />
      </div>
    </div>
  );
}
