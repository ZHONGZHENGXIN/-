import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts';
import { WealthTrajectoryPoint, Equilibrium } from '../types';

interface Props {
  trajectories: WealthTrajectoryPoint[];
  equilibria: Equilibrium[];
  pushTime: number;
}

const WealthSimulationChart: React.FC<Props> = ({ trajectories, equilibria, pushTime }) => {
  // Identify the poverty trap threshold (Unstable equilibrium)
  const threshold = equilibria.find(e => e.type === 'Unstable')?.k;
  const highStable = equilibria.filter(e => e.type === 'Stable').pop()?.k || 0;

  // Generate lines dynamically based on data keys
  const paths = Object.keys(trajectories[0] || {}).filter(k => k.startsWith('path'));

  return (
    <div className="w-full h-[400px] bg-white rounded-xl p-4 shadow-lg border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-1">人生演化模拟 (Evolution)</h3>
      <p className="text-xs text-gray-500 mb-6">
        多条随机轨迹的蒙特卡洛模拟。虚线为贫困陷阱阈值，低于此值的轨迹往往回落至贫困态。
      </p>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={trajectories} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
          <XAxis 
            dataKey="step" 
            label={{ value: 'Time (t)', position: 'insideBottomRight', offset: -5, fontSize: 10 }}
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            label={{ value: 'Wealth (k)', angle: -90, position: 'insideLeft', fontSize: 10 }}
            domain={[0, Math.max(30, highStable + 5)]}
            tick={{ fontSize: 10 }}
          />
          <Tooltip 
             contentStyle={{ backgroundColor: '#ffffff', fontSize: '12px' }}
             labelFormatter={(l) => `Time ${l}`}
          />
          
          {/* Poverty Trap Threshold */}
          {threshold && (
            <ReferenceLine 
              y={threshold} 
              stroke="#dc2626" 
              strokeDasharray="3 3" 
              label={{ value: 'Trap Threshold', fill: '#dc2626', fontSize: 10, position: 'insideRight' }} 
            />
          )}

          {/* Policy Push Time Marker */}
          {pushTime > 0 && (
             <ReferenceLine 
             x={pushTime} 
             stroke="#f59e0b" 
             strokeDasharray="3 3" 
             label={{ value: 'Big Push', fill: '#f59e0b', fontSize: 10, position: 'insideTop' }} 
           />
          )}

          {/* Trajectories */}
          {paths.map((pathKey, idx) => (
            <Line 
              key={pathKey}
              type="monotone" 
              dataKey={pathKey} 
              stroke="#3b82f6" 
              strokeWidth={1}
              strokeOpacity={0.4} // Semi-transparent to handle density
              dot={false}
              isAnimationActive={false} // Performance optimization for many lines
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WealthSimulationChart;