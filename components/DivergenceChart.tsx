import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea 
} from 'recharts';
import { SimulationStep, STATE_LABELS } from '../types';

interface Props {
  data: SimulationStep[];
}

const DivergenceChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-[400px] bg-white rounded-xl p-4 shadow-lg border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-1">概率锥 (分歧演化)</h3>
      <p className="text-xs text-gray-500 mb-6">
        追踪 10 年间“人生状态期望值”的变化。两条曲线之间的开口直观展示了微习惯复利带来的巨大分歧。
      </p>
      
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="habitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.8} />
          <XAxis 
            dataKey="day" 
            stroke="#6b7280" 
            tickFormatter={(day) => `第 ${(day / 365).toFixed(0)} 年`}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis 
            stroke="#6b7280" 
            domain={[0, 4]} 
            ticks={[0, 1, 2, 3, 4]}
            tickFormatter={(val) => `Lv ${val}`}
            tick={{ fill: '#6b7280' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#111827' }}
            formatter={(value: number) => value.toFixed(2)}
            labelFormatter={(label) => `第 ${label} 天`}
            labelStyle={{ color: '#6b7280' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          <Line 
            type="monotone" 
            dataKey="baselineExpectedValue" 
            name="默认人生 (随波逐流)" 
            stroke="#4b5563" 
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="habitExpectedValue" 
            name="微习惯加持 (复利效应)" 
            stroke="#dc2626" 
            strokeWidth={3} 
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DivergenceChart;