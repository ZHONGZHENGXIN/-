import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell 
} from 'recharts';
import { Vector, STATE_LABELS, STATE_COLORS } from '../types';

interface Props {
  baselineDist: Vector;
  habitDist: Vector;
}

const DistributionChart: React.FC<Props> = ({ baselineDist, habitDist }) => {
  const data = baselineDist.map((val, idx) => ({
    state: idx,
    label: STATE_LABELS[idx as keyof typeof STATE_LABELS],
    Baseline: val,
    Habits: habitDist[idx],
  }));

  return (
    <div className="w-full h-[400px] bg-white rounded-xl p-4 shadow-lg border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-1">终局分布对比 (第 10 年)</h3>
      <p className="text-xs text-gray-500 mb-6">
        模拟结束时，处于各个生命层级的最终概率分布。
      </p>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.8} />
          <XAxis 
            dataKey="label" 
            stroke="#6b7280" 
            tick={{fontSize: 10, fill: '#6b7280'}}
            interval={0}
          />
          <YAxis 
            stroke="#6b7280" 
            tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} 
            tick={{ fill: '#6b7280' }}
          />
          <Tooltip 
            cursor={{fill: '#f3f4f6', opacity: 0.5}}
            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#111827' }}
            formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
            labelStyle={{ color: '#6b7280' }}
          />
          <Legend />
          <Bar dataKey="Baseline" fill="#4b5563" name="默认路径" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Habits" fill="#dc2626" name="微习惯路径" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistributionChart;