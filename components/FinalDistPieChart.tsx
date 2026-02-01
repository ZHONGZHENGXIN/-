import React from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Vector, STATE_LABELS, STATE_COLORS } from '../types';

interface Props {
  data: Vector;
}

const FinalDistPieChart: React.FC<Props> = ({ data }) => {
  const chartData = data.map((val, idx) => ({
    name: STATE_LABELS[idx as keyof typeof STATE_LABELS].split('/')[0],
    value: val,
    color: STATE_COLORS[idx]
  })).filter(d => d.value > 0.001); // Filter out zero probability states for cleaner pie

  return (
    <div className="w-full h-[350px] bg-white rounded-xl p-4 shadow-lg border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-1">终局命运 (Final Destiny)</h3>
      <p className="text-xs text-gray-500 mb-4">
        当 $t \to \infty$ 时，人生状态的最终概率分布。
      </p>
      
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
             formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
             contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinalDistPieChart;