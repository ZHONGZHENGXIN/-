import React, { useState, useEffect } from 'react';
import { SCENARIOS, calculateBayes, getInterpretation } from '../services/bayesService';
import { BayesConfig, BayesScenarioType } from '../types';
import { BrainCircuit, Calculator, ArrowRight, HelpCircle } from 'lucide-react';

const BayesSimulator: React.FC = () => {
  const [scenarioType, setScenarioType] = useState<BayesScenarioType>('disease');
  const [config, setConfig] = useState<BayesConfig>(SCENARIOS['disease'].config);
  
  // Reset config when scenario changes
  useEffect(() => {
    setConfig(SCENARIOS[scenarioType].config);
  }, [scenarioType]);

  const result = calculateBayes(config);

  // Colors
  const colorH = "#3b82f6"; // Blue (Hypothesis True)
  const colorNotH = "#9ca3af"; // Gray (Hypothesis False)
  const colorE = "#f59e0b"; // Amber (Evidence) - Used for highlight overlay

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Top Controls: Scenario Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(SCENARIOS) as BayesScenarioType[]).map((key) => (
          <button
            key={key}
            onClick={() => setScenarioType(key)}
            className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
              scenarioType === key
                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {SCENARIOS[key].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Visualization (Area Chart) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg relative overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BrainCircuit className="text-blue-600" size={20}/> {SCENARIOS[scenarioType].label} - 概率空间可视化 (Area Method)
            </h3>
            
            {/* The Visualization Container */}
            <div className="w-full h-[320px] flex rounded-lg overflow-hidden border-2 border-gray-100 bg-gray-50 relative">
               
               {/* Left Block: Hypothesis True (P(H)) */}
               <div 
                 className="h-full flex flex-col relative transition-all duration-500"
                 style={{ width: `${result.p_h * 100}%` }}
               >
                 {/* Top: True Positive P(E|H) */}
                 <div 
                    className="w-full relative bg-blue-500 transition-all duration-500 flex items-center justify-center text-white text-xs font-bold border-b border-white/20 hover:opacity-90 group"
                    style={{ height: `${result.p_e_given_h * 100}%` }}
                 >
                    <span className="z-10 text-center px-1">
                      真阳性<br/>
                      {(result.p_e_and_h * 100).toFixed(1)}%
                    </span>
                    {/* Pattern Overlay for Evidence */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-30"></div>
                 </div>
                 
                 {/* Bottom: False Negative */}
                 <div className="flex-1 bg-blue-200 flex items-center justify-center text-blue-800 text-xs transition-all duration-500">
                    <span className="opacity-50">漏报</span>
                 </div>

                 {/* Label */}
                 <div className="absolute -bottom-8 left-0 w-full text-center text-xs font-bold text-blue-600">
                    假设成立 P(H) <br/> {(result.p_h * 100).toFixed(0)}%
                 </div>
               </div>

               {/* Right Block: Hypothesis False (P(~H)) */}
               <div 
                 className="h-full flex flex-col relative transition-all duration-500"
                 style={{ width: `${result.p_not_h * 100}%` }}
               >
                  {/* Top: False Positive P(E|~H) */}
                  <div 
                    className="w-full relative bg-red-400 transition-all duration-500 flex items-center justify-center text-white text-xs font-bold border-b border-white/20 hover:opacity-90"
                    style={{ height: `${result.p_e_given_not_h * 100}%` }}
                  >
                     <span className="z-10 text-center px-1">
                        假阳性<br/>
                        {(result.p_e_and_not_h * 100).toFixed(1)}%
                     </span>
                     {/* Pattern Overlay for Evidence */}
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-30"></div>
                  </div>

                  {/* Bottom: True Negative */}
                  <div className="flex-1 bg-gray-200 flex items-center justify-center text-gray-500 text-xs transition-all duration-500">
                     <span className="opacity-50">真阴性</span>
                  </div>

                  {/* Label */}
                  <div className="absolute -bottom-8 left-0 w-full text-center text-xs font-bold text-gray-500">
                    假设不成立 P(~H) <br/> {(result.p_not_h * 100).toFixed(0)}%
                 </div>
               </div>
            </div>

            {/* Legend / Explanation for Area */}
            <div className="mt-12 text-xs text-gray-500 flex flex-wrap gap-4 justify-center">
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 bg-blue-500 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>
                 <span>证据覆盖区域 (E)</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 bg-blue-500"></div>
                 <span>真阳性区域 (H ∩ E)</span>
               </div>
            </div>
          </div>

          {/* Equation View */}
          <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg font-mono text-sm md:text-base overflow-x-auto">
             <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs uppercase tracking-wider">
               <Calculator size={14}/> 贝叶斯公式计算
             </div>
             
             <div className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-yellow-400">P(H|E)</span>
                  <span className="text-2xl">=</span>
                  <div className="flex flex-col items-center">
                     <div className="border-b border-gray-500 px-2 pb-1 mb-1 text-center">
                        <span className="text-blue-400">P(E|H)</span> · <span className="text-green-400">P(H)</span>
                     </div>
                     <div className="text-center text-gray-400">P(E)</div>
                  </div>
                </div>

                <ArrowRight className="text-gray-600 rotate-90"/>

                <div className="flex items-center gap-4">
                   <span className="text-3xl font-bold text-yellow-400">{(result.posterior * 100).toFixed(1)}%</span>
                   <span className="text-2xl">=</span>
                   <div className="flex flex-col items-center">
                      <div className="border-b border-gray-500 px-2 pb-1 mb-1">
                         <span className="text-blue-400">{config.sensitivity.toFixed(2)}</span>
                         <span className="mx-2">×</span>
                         <span className="text-green-400">{config.prior.toFixed(3)}</span>
                      </div>
                      <div className="text-gray-300">
                         {result.p_e.toFixed(4)}
                         <span className="text-xs text-gray-500 ml-2">(总证据概率)</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right: Controls & Interpretation */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
              <div className="pb-4 border-b border-gray-200">
                 <h4 className="font-bold text-gray-900">{SCENARIOS[scenarioType].label}</h4>
                 <p className="text-xs text-gray-500 mt-1">{SCENARIOS[scenarioType].desc}</p>
              </div>

              <Slider 
                 label="先验概率 P(H)" 
                 value={config.prior} 
                 onChange={(v) => setConfig({...config, prior: v})}
                 color="accent-green-500"
                 desc="在看到证据之前，你认为假设成立的可能性。"
              />
              <Slider 
                 label="敏感度 P(E|H)" 
                 value={config.sensitivity} 
                 onChange={(v) => setConfig({...config, sensitivity: v})}
                 color="accent-blue-500"
                 desc="如果假设是真的，出现证据的概率 (真阳性率)。"
              />
              <Slider 
                 label="假阳性率 P(E|~H)" 
                 value={config.falsePositive} 
                 onChange={(v) => setConfig({...config, falsePositive: v})}
                 max={0.5} // Limit false positive slider usually
                 color="accent-red-500"
                 desc="如果假设是假的，依然出现证据的概率 (误报)。"
              />
           </div>

           <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 text-blue-900 shadow-sm">
              <div className="flex items-start gap-3">
                 <HelpCircle className="shrink-0 text-blue-600 mt-1" size={20} />
                 <div>
                    <h4 className="font-bold text-sm mb-1">实时反馈</h4>
                    <p className="text-sm leading-relaxed">
                       {getInterpretation(result, scenarioType)}
                    </p>
                 </div>
              </div>
           </div>

           {/* Achievement / Insight badge based on values */}
           {result.posterior > 0.9 && (
             <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-xs font-bold text-center animate-bounce">
                🚀 极高确信度！证据非常有说服力。
             </div>
           )}
           {result.posterior < config.prior && (
             <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-xs font-bold text-center">
                📉 证据居然降低了概率？(可能是因为假阳性率太高或敏感度太低)
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

// Helper slider
const Slider = ({ label, value, onChange, max = 1, color, desc }: any) => (
  <div className="space-y-2 group">
    <div className="flex justify-between items-center text-sm font-bold text-gray-700">
      <span>{label}</span>
      <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
        {(value * 100).toFixed(1)}%
      </span>
    </div>
    <input 
      type="range" min="0.001" max={max} step="0.001"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${color}`}
    />
    <p className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
       {desc}
    </p>
  </div>
);

export default BayesSimulator;