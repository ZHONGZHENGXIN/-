import React from 'react';
import { Matrix, STATE_LABELS, STATE_COLORS } from '../types';

interface Props {
  matrix: Matrix;
}

const MarkovGraph: React.FC<Props> = ({ matrix }) => {
  const width = 600;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 180;
  const nodeRadius = 35;

  // Calculate node positions
  const nodes = Array.from({ length: 5 }).map((_, i) => {
    // Start from top ( -90 deg), distribute evenly
    const angle = (i * 72 - 90) * (Math.PI / 180);
    return {
      id: i,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      label: STATE_LABELS[i as keyof typeof STATE_LABELS],
      color: STATE_COLORS[i],
    };
  });

  return (
    <div className="w-full h-full flex items-center justify-center bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="max-w-[800px]">
        <defs>
          <marker 
            id="arrowhead" 
            markerWidth="10" 
            markerHeight="7" 
            refX="28" 
            refY="3.5" 
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
          </marker>
        </defs>

        {/* Edges */}
        {matrix.map((row, sourceIdx) => 
          row.map((prob, targetIdx) => {
            if (prob < 0.01) return null; // Don't draw tiny probabilities

            const source = nodes[sourceIdx];
            const target = nodes[targetIdx];
            const strokeWidth = Math.max(1, prob * 12); // Thickness based on probability
            const opacity = Math.min(1, prob * 1.5 + 0.2);

            // Self Loop
            if (sourceIdx === targetIdx) {
              // Calculate loop direction (outward from center)
              const dx = source.x - centerX;
              const dy = source.y - centerY;
              const len = Math.sqrt(dx*dx + dy*dy);
              const nx = dx / len;
              const ny = dy / len;
              
              const loopR = 40;
              const x1 = source.x + nx * 10;
              const y1 = source.y + ny * 10;
              const x2 = source.x + nx * (loopR + 20);
              const y2 = source.y + ny * (loopR + 20);
              
              return (
                <path
                  key={`edge-${sourceIdx}-${targetIdx}`}
                  d={`M ${source.x - ny*10} ${source.y + nx*10} C ${x2 - ny*30} ${y2 + nx*30}, ${x2 + ny*30} ${y2 - nx*30}, ${source.x + ny*10} ${source.y - nx*10}`}
                  fill="none"
                  stroke={source.color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={opacity}
                  markerEnd="url(#arrowhead)"
                />
              );
            }

            // Curved Edge between different nodes
            // Calculate control point for curve
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            const dist = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2));
            
            // Offset logic for bidirectional separation
            // Vector source -> target
            const vx = target.x - source.x;
            const vy = target.y - source.y;
            // Normal vector
            const normX = -vy;
            const normY = vx;
            const normLen = Math.sqrt(normX*normX + normY*normY);
            
            // Curve amount (arc height)
            const curveHeight = 40; 
            const cpX = midX + (normX / normLen) * curveHeight;
            const cpY = midY + (normY / normLen) * curveHeight;

            return (
              <path
                key={`edge-${sourceIdx}-${targetIdx}`}
                d={`M ${source.x} ${source.y} Q ${cpX} ${cpY} ${target.x} ${target.y}`}
                fill="none"
                stroke={source.color}
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
                markerEnd="url(#arrowhead)"
              />
            );
          })
        )}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius}
              fill="white"
              stroke={node.color}
              strokeWidth="4"
              className="transition-all duration-300"
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dy=".3em"
              fill="#1f2937"
              fontWeight="bold"
              fontSize="14"
              className="pointer-events-none"
            >
              S{node.id}
            </text>
            <text
              x={node.x}
              y={node.y + nodeRadius + 20}
              textAnchor="middle"
              fill={node.color}
              fontSize="12"
              fontWeight="600"
            >
              {node.label.split('/')[0]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default MarkovGraph;