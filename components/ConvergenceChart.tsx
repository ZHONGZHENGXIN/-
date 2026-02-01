import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { ConvergenceDataPoint } from '../types';

interface Props {
  data: ConvergenceDataPoint[];
}

const ConvergenceChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-[350px] bg-white rounded-xl p-4 shadow-lg border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-1">收敛速度 (TVD Decay)</h3>
      <p className="text-xs text-gray-500 mb-6">
        总变差距离 (TVD) 随时间的下降曲线。斜率由第二大特征值 $\lambda_2$ 决定。
      </p>
      
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="step" 
            label={{ value: 'Time Steps', position: 'insideBottomRight', offset: -5, fontSize: 10 }} 
            tick={{fontSize: 10}}
          />
          <YAxis 
            scale="log" 
            domain={['auto', 'auto']} 
            allowDataOverflow
            tickFormatter={(v) => v.toExponential(1)}
            tick={{fontSize: 10}}
            width={50}
          />
          <Tooltip 
             contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', fontSize: '12px' }}
             formatter={(val: number) => val.toExponential(4)}
             labelFormatter={(l) => `Step ${l}`}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }}/>
          <Line 
            type="monotone" 
            dataKey="tvd" 
            name="Simulated TVD" 
            stroke="#dc2626" 
            strokeWidth={2}
            dot={false} 
          />
          <Line 
            type="monotone" 
            dataKey="theoreticalBound" 
            name="Theoretical Bound" 
            stroke="#9ca3af" 
            strokeDasharray="5 5" 
            strokeWidth={2}
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConvergenceChart;