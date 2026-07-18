import { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface SpendRingProps {
  spent: number;
  budget: number;
  size?: number;
}

function SpendRingBase({ spent, budget, size = 180 }: SpendRingProps) {
  const safeBudget = Math.max(budget, 0);
  const fraction = safeBudget > 0 ? Math.min(spent / safeBudget, 1) : spent > 0 ? 1 : 0;
  const remaining = safeBudget > 0 ? Math.max(safeBudget - spent, 0) : 0;
  const over = safeBudget > 0 && spent > safeBudget;

  const data =
    safeBudget > 0
      ? [
          { value: fraction, color: over ? 'rgb(var(--danger))' : 'rgb(var(--accent))' },
          { value: Math.max(1 - fraction, 0.0001), color: 'rgb(var(--surface-3))' },
        ]
      : spent > 0
      ? [{ value: 1, color: 'rgb(var(--accent))' }]
      : [{ value: 1, color: 'rgb(var(--surface-3))' }];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={size * 0.38}
            outerRadius={size * 0.5}
            paddingAngle={0}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
            animationDuration={0}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-medium text-tertiary uppercase tracking-wide">Spent</span>
        <span className="text-2xl font-bold text-label leading-tight">{formatCurrency(spent)}</span>
        {safeBudget > 0 ? (
          <span className={`text-[11px] font-medium ${over ? 'text-danger' : 'text-tertiary'}`}>
            {over ? `${formatCurrency(spent - safeBudget)} over` : `${formatCurrency(remaining)} left`}
          </span>
        ) : (
          <span className="text-[11px] font-medium text-tertiary">No budget</span>
        )}
      </div>
    </div>
  );
}

export const SpendRing = memo(SpendRingBase);