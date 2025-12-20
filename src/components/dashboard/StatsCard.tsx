import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

export function StatsCard({ title, value, change, changeType = 'neutral', icon: Icon, iconColor, ...props }: StatsCardProps & { style?: React.CSSProperties }) {
  return (
    <div 
      className="group rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/95 p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/20 animate-fade-in-up cursor-pointer backdrop-blur-sm"
      style={props.style}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
          {change && (
            <p className={cn(
              "mt-1 text-sm font-medium",
              changeType === 'positive' && "text-success",
              changeType === 'negative' && "text-destructive",
              changeType === 'neutral' && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
          iconColor || "bg-gradient-to-br from-primary/20 to-primary/10 shadow-md shadow-primary/10"
        )}>
          <Icon className={cn(
            "h-6 w-6 transition-transform duration-300",
            iconColor ? "text-current" : "text-primary"
          )} />
        </div>
      </div>
    </div>
  );
}
