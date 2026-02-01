import React from 'react';

interface Props {
  lambda2: number;
}

const EigenvalueChart: React.FC<Props> = ({ lambda2 }) => {
  // SVG Canvas settings
  const size = 300;
  const center = size / 2;
  const radius = 100; // Unit circle radius in pixels

  return (
    <div className="w-full h-[350px] bg-white rounded-xl p-4 shadow-lg border border-gray-200 flex flex-col items-center">
      <h3 className="text-lg font-bold text-gray-900 mb-1">谱平面 (Spectral Plane)</h3>
      <p className="text-xs text-gray-500 mb-4 text-center">
        复平面上的特征值分布。红色点为 $\lambda_2$，距离圆心越近，收敛越快。
      </p>
      
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="#9ca3af" />
          </marker>
        </defs>

        {/* Axes */}
        <line x1={center} y1={20} x2={center} y2={size-20} stroke="#e5e7eb" strokeWidth="2" markerEnd="url(#arrow)" />
        <line x1={20} y1={center} x2={size-20} y2={center} stroke="#e5e7eb" strokeWidth="2" markerEnd="url(#arrow)" />

        {/* Unit Circle */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e5e7eb" strokeDasharray="4 4" />
        <text x={center + radius + 5} y={center + 15} fontSize="10" fill="#9ca3af">1.0</text>

        {/* Eigenvalues */}
        {/* Lambda 1 (Always at 1.0) */}
        <circle cx={center + radius} cy={center} r={6} fill="#4b5563" />
        <text x={center + radius - 10} y={center - 10} fontSize="12" fontWeight="bold" fill="#4b5563">λ1</text>

        {/* Lambda 2 (Dynamic) */}
        <circle 
            cx={center + (lambda2 * radius)} 
            cy={center} 
            r={8} 
            fill="#dc2626" 
            stroke="white" 
            strokeWidth="2"
            className="transition-all duration-300 ease-out"
        />
        <text 
            x={center + (lambda2 * radius)} 
            y={center - 15} 
            textAnchor="middle" 
            fontSize="12" 
            fontWeight="bold" 
            fill="#dc2626"
            className="transition-all duration-300 ease-out"
        >
            λ2
        </text>

        {/* Annotations */}
        <text x={center} y={size - 10} textAnchor="middle" fontSize="11" fill="#6b7280">
            Spectral Gap γ = {(1 - lambda2).toFixed(3)}
        </text>
      </svg>
    </div>
  );
};

export default EigenvalueChart;