import React from 'react';
import { Matrix } from '../types';

interface Props {
  matrix: Matrix;
  title: string;
}

const MatrixGrid: React.FC<Props> = ({ matrix, title }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h4 className="text-sm font-bold text-gray-700 mb-4">{title}</h4>
      <div className="grid grid-cols-6 gap-1 text-xs">
        {/* Header Row */}
        <div className="text-gray-400 font-mono flex items-center justify-center">从\到</div>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="text-gray-500 font-mono flex items-center justify-center font-semibold">
            S{i}
          </div>
        ))}

        {/* Matrix Rows */}
        {matrix.map((row, i) => (
          <React.Fragment key={i}>
            <div className="text-gray-500 font-mono flex items-center justify-center font-bold">
              S{i}
            </div>
            {row.map((val, j) => {
              // Highlight probability mass with RED opacity
              const opacity = val; 
              const color = `rgba(220, 38, 38, ${0.05 + opacity * 0.95})`; // Red base
              
              // Text color needs to be white if background is dark red, black otherwise
              const textColor = val > 0.5 ? '#ffffff' : '#111827';
              
              return (
                <div 
                  key={`${i}-${j}`} 
                  className="h-8 flex items-center justify-center rounded border border-gray-200 transition-colors hover:border-red-500"
                  style={{ backgroundColor: val > 0.01 ? color : '#ffffff', color: val > 0.01 ? textColor : '#d1d5db' }}
                >
                  {val.toFixed(2)}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default MatrixGrid;