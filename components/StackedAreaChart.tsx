import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { SimulationStep, STATE_LABELS, STATE_COLORS } from '../types';

interface Props {
  data: SimulationStep[];
  title?: string;
}

const StackedAreaChart: React.FC<Props> = ({ data, title = "人口分布演化 (Stacked Area)" }) => {
  const chartData = data.map(step => ({
    day: step.day,
    s0: step.habitDist[0],
    s1: step.habitDist[1],
    s2: step.habitDist[2],
    s3: step.habitDist[3],
    s4: step.habitDist[4],
  }));

  return (
    <div className="w-full h-[400px] bg-white rounded-xl p-4 shadow-lg border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-6">
        展示群体中各阶层占比随时间的累积变化。注意最终趋于平稳的“层级结构”。
      </p>
      
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {STATE_COLORS.map((color, i) => (
              <linearGradient key={i} id={`colorS${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis 
            dataKey="day" 
            tickFormatter={(d) => `Y${(d/365).toFixed(1)}`}
            stroke="#9ca3af"
            tick={{fontSize: 10}}
          />
          <YAxis 
            tickFormatter={(v) => `${(v*100).toFixed(0)}%`}
            stroke="#9ca3af"
            tick={{fontSize: 10}}
          />
          <Tooltip 
             contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', fontSize: '12px' }}
             formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
          />
          <Legend iconType="rect" wrapperStyle={{ fontSize: '10px' }}/>
          
          {STATE_COLORS.map((color, i) => (
            <Area
              key={i}
              type="monotone"
              dataKey={`s${i}`}
              name={STATE_LABELS[i as keyof typeof STATE_LABELS].split('/')[0]}
              stackId="1"
              stroke={color}
              fill={`url(#colorS${i})`}
              fillOpacity={1}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StackedAreaChart;