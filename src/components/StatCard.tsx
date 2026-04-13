import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export function StatCard({ title, value, icon, change, changeType = 'neutral' }: StatCardProps) {
  const changeColor = changeType === 'positive' ? 'text-primary' : changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      {change && (
        <p className={`text-xs mt-1 ${changeColor}`}>{change}</p>
      )}
    </div>
  );
}
