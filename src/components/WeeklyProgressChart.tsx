import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { ActivityRecord } from '@/types/lesson';

interface WeeklyProgressChartProps {
  activityHistory: ActivityRecord[];
}

export const WeeklyProgressChart = ({ activityHistory }: WeeklyProgressChartProps) => {
  const weekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const record = activityHistory.find(r => r.date === dateStr);
      
      data.push({
        day: days[date.getDay()],
        count: record?.count || 0,
        isToday: i === 0,
      });
    }

    return data;
  }, [activityHistory]);

  const maxCount = Math.max(...weekData.map(d => d.count), 1);

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={weekData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            allowDecimals={false}
          />
          <Bar 
            dataKey="count" 
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          >
            {weekData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.isToday ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.5)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Last 7 days</span>
        <span className="font-medium text-foreground">
          {weekData.reduce((sum, d) => sum + d.count, 0)} reviews
        </span>
      </div>
    </div>
  );
};
