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

export function StatsCard({ title, value, change, changeType = 'neutral', icon: Icon, iconColor }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated animate-fade-in">
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
          "flex h-12 w-12 items-center justify-center rounded-lg",
          iconColor || "bg-primary/10"
        )}>
          <Icon className={cn(
            "h-6 w-6",
            iconColor ? "text-current" : "text-primary"
          )} />
        </div>
      </div>
    </div>
  );
}
