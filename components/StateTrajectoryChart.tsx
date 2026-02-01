import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { SimulationStep, STATE_LABELS, STATE_COLORS } from '../types';

interface Props {
  data: SimulationStep[];
  title: string;
}

const StateTrajectoryChart: React.FC<Props> = ({ data, title }) => {
  // Transform data for Recharts: Flatten the distribution arrays into named keys
  // We will visualize the "Habit" distribution (or whichever is active in simulation)
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
        各状态概率随时间的演化轨迹。观察群体如何从初始状态逐渐流动并分布到不同层级。
      </p>
      
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.8} />
          <XAxis 
            dataKey="day" 
            stroke="#6b7280" 
            tickFormatter={(day) => `Y${(day / 365).toFixed(1)}`}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#6b7280" 
            tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
            tick={{ fill: '#6b7280', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827', fontSize: '12px' }}
            formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
            labelFormatter={(label) => `Day ${label}`}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
          
          {STATE_COLORS.map((color, index) => (
            <Line 
              key={index}
              type="monotone" 
              dataKey={`s${index}`} 
              name={STATE_LABELS[index as keyof typeof STATE_LABELS].split('/')[0]}
              stroke={color} 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StateTrajectoryChart;