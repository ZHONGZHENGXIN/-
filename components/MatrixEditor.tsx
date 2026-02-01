import React from 'react';
import { Matrix, STATE_LABELS, STATE_COLORS } from '../types';

interface Props {
  matrix: Matrix;
  onUpdate: (row: number, col: number, val: number) => void;
}

const MatrixEditor: React.FC<Props> = ({ matrix, onUpdate }) => {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 h-full overflow-y-auto custom-scrollbar">
      <h3 className="text-lg font-bold text-gray-900 mb-4 sticky top-0 bg-gray-50 pb-2 border-b border-gray-200 z-10">
        状态转移概率调整
      </h3>
      
      <div className="space-y-6">
        {matrix.map((row, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: STATE_COLORS[i] }} 
              />
              <span className="font-bold text-gray-800">
                S{i} {STATE_LABELS[i as keyof typeof STATE_LABELS].split('/')[0]} (源)
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {row.map((prob, j) => {
                // Only show slider if there is a realistic connection or if it's adjacent/self
                // To avoid cluttering UI with 0.00 probabilities for impossible jumps (e.g. 0->4)
                const isRelevant = prob > 0.001 || Math.abs(i - j) <= 1;
                
                if (!isRelevant) return null;

                return (
                  <div key={`${i}-${j}`} className="flex items-center gap-3 text-sm">
                    <div className="w-16 font-mono text-gray-500 text-xs">
                      To S{j}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={prob}
                      onChange={(e) => onUpdate(i, j, parseFloat(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-800"
                    />
                    <div className="w-12 text-right font-mono font-medium text-gray-900">
                      {(prob * 100).toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Row Sum Validation Display */}
            <div className="mt-2 text-right text-xs text-gray-400">
              Row Sum: {row.reduce((a,b)=>a+b,0).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatrixEditor;