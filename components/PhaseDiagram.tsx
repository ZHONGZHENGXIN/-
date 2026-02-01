import React from 'react';
import { 
  ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Area 
} from 'recharts';
import { Equilibrium, PhaseDiagramDataPoint } from '../types';

interface Props {
  data: PhaseDiagramDataPoint[];
  equilibria: Equilibrium[];
  cobwebPath: {k: number, nextK: number}[];
}

const PhaseDiagram: React.FC<Props> = ({ data, equilibria, cobwebPath }) => {
  
  // Separate equilibria for distinct styling
  const stablePoints = equilibria.filter(e => e.type === 'Stable').map(e => ({ x: e.k, y: e.k }));
  const unstablePoints = equilibria.filter(e => e.type === 'Unstable').map(e => ({ x: e.k, y: e.k }));

  return (
    <div className="w-full h-[400px] bg-white rounded-xl p-4 shadow-lg border border-gray-200 relative">
      <h3 className="text-lg font-bold text-gray-900 mb-1">相位图 (Phase Diagram)</h3>
      <p className="text-xs text-gray-500 mb-6">
        {'展示资本积累动态 $k_{t+1} = f(k_t)$。与 45° 线的交点即为均衡点。'}
      </p>

      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
          <XAxis 
            dataKey="k" 
            type="number" 
            domain={[0, 30]} 
            label={{ value: 'Current Capital (kt)', position: 'insideBottomRight', offset: -5, fontSize: 10 }}
            tick={{ fontSize: 10 }}
            allowDataOverflow
          />
          <YAxis 
            domain={[0, 30]} 
            label={{ value: 'Next Capital (kt+1)', angle: -90, position: 'insideLeft', fontSize: 10 }}
            tick={{ fontSize: 10 }}
            allowDataOverflow
          />
          <Tooltip 
             contentStyle={{ backgroundColor: '#ffffff', fontSize: '12px' }}
             cursor={{ stroke: '#9ca3af', strokeWidth: 1 }}
             formatter={(value: number, name: string) => [value.toFixed(2), name]}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />

          {/* 45 Degree Line */}
          <Line 
            data={data}
            type="monotone" 
            dataKey="depreciation" 
            name="45° Line (Break-even)" 
            stroke="#9ca3af" 
            strokeDasharray="5 5" 
            strokeWidth={1.5}
            dot={false}
          />

          {/* S-Curve */}
          <Line 
            data={data}
            type="monotone" 
            dataKey="nextK" 
            name="Accumulation Curve" 
            stroke="#2563eb" 
            strokeWidth={3}
            dot={false}
          />
          
          {/* Cobweb Path (Custom visualization using multiple lines or just implied) 
              Recharts scatter with line is tricky for arbitrary paths, 
              so we just plot the equilibria points primarily. 
          */}

          {/* Stable Equilibria */}
          <Scatter 
            name="Stable Point" 
            data={stablePoints} 
            fill="#16a34a" 
            shape="circle"
          />

          {/* Unstable Equilibria */}
          <Scatter 
            name="Unstable Point (Threshold)" 
            data={unstablePoints} 
            fill="#ffffff" 
            stroke="#dc2626"
            strokeWidth={2}
            shape="circle"
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PhaseDiagram;