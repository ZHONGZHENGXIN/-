import React, { useState, useEffect } from 'react';
import { 
  runSimulation, 
  runConvergenceSimulation,
  runPathSimulation,
  createBaselineMatrix, 
  updateMatrixProbability
} from './services/markovService';
import { 
  runWealthSimulation as runWealthSimLogic 
} from './services/wealthService';

import DivergenceChart from './components/DivergenceChart';
import DistributionChart from './components/DistributionChart';
import StateTrajectoryChart from './components/StateTrajectoryChart';
import StackedAreaChart from './components/StackedAreaChart';
import ConvergenceChart from './components/ConvergenceChart';
import EigenvalueChart from './components/EigenvalueChart';
import PhaseDiagram from './components/PhaseDiagram';
import WealthSimulationChart from './components/WealthSimulationChart';
import MatrixGrid from './components/MatrixGrid';
import MarkovGraph from './components/MarkovGraph';
import MatrixEditor from './components/MatrixEditor';
import FinalDistPieChart from './components/FinalDistPieChart';
import Guide from './components/Guide'; // Import Guide
import { SimulationResult, ConvergenceResult, WealthSimulationResult, Matrix, PathResult, STATE_LABELS, LifeState } from './types';
import { 
  TrendingUp, Activity, GitCommit, Settings2, LayoutDashboard, Clock, UserCircle, 
  Anchor, Zap, BarChart3, Lock, Rocket, Route, BookOpen 
} from 'lucide-react';

export default function App() {
  // Set default tab to 'guide' for new users
  const [activeTab, setActiveTab] = useState<'guide' | 'structure' | 'simulation' | 'steady' | 'convergence' | 'trap' | 'evolution' | 'path'>('guide');
  
  // -- Simulation State (Module 1-3) --
  const [impactFactor, setImpactFactor] = useState<number>(0.015);
  const [simulationYears, setSimulationYears] = useState<number>(10);
  const [initialState, setInitialState] = useState<number>(LifeState.Struggling);
  const [customMatrix, setCustomMatrix] = useState<Matrix>(createBaselineMatrix());
  const [result, setResult] = useState<SimulationResult | null>(null);

  // -- Convergence State (Module 4) --
  const [mobilityFactor, setMobilityFactor] = useState<number>(0.2);
  const [convResult, setConvResult] = useState<ConvergenceResult | null>(null);

  // -- Wealth Dynamics State (Module 5-6) --
  const [wealthConfig, setWealthConfig] = useState({
    A: 8.0,      // Productivity
    s: 0.2,      // Savings
    H: 10.0,     // Threshold
    gamma: 3.0,  // Shape
    delta: 0.1,  // Depreciation
    sigma: 0.5,  // Noise
    initialK: 8.0, // Initial Capital
    pushMagnitude: 0, // Big Push
    pushTime: 20      // Push Time
  });
  const [wealthResult, setWealthResult] = useState<WealthSimulationResult | null>(null);

  // -- Path Dependence State (Module 7) --
  const [pathConfig, setPathConfig] = useState({
    effort: 0.3,
    risk: 0.1,
    isAbsorbing: true
  });
  const [pathResult, setPathResult] = useState<PathResult | null>(null);

  // Effect: Run General Simulation (Modules 1-3)
  useEffect(() => {
    // Optimization: Only run sim if active tab requires it
    const relevantTabs = ['structure', 'simulation', 'steady'];
    if (!relevantTabs.includes(activeTab) && activeTab !== 'guide') return; // 'guide' doesn't need it but we init it anyway or lazy load? 
    // Actually simpler to just run it, computation is cheap enough.
    
    const useInteractiveMatrix = activeTab === 'structure' || activeTab === 'steady';
    const matrixToUse = useInteractiveMatrix ? customMatrix : undefined;
    const simResult = runSimulation({
      years: simulationYears,
      impactFactor: impactFactor,
      initialState: initialState,
    }, matrixToUse);
    setResult(simResult);
  }, [impactFactor, simulationYears, initialState, activeTab, customMatrix]);

  // Effect: Run Convergence Simulation (Module 4)
  useEffect(() => {
    if (activeTab === 'convergence') {
      const res = runConvergenceSimulation(mobilityFactor);
      setConvResult(res);
    }
  }, [mobilityFactor, activeTab]);

  // Effect: Run Wealth Simulation (Module 5-6)
  useEffect(() => {
    if (activeTab === 'trap' || activeTab === 'evolution') {
      const res = runWealthSimLogic(wealthConfig);
      setWealthResult(res);
    }
  }, [wealthConfig, activeTab]);

  // Effect: Run Path Dependence Simulation (Module 7)
  useEffect(() => {
    if (activeTab === 'path') {
      const res = runPathSimulation(pathConfig);
      setPathResult(res);
    }
  }, [pathConfig, activeTab]);

  const handleMatrixUpdate = (row: number, col: number, val: number) => {
    const updated = updateMatrixProbability(customMatrix, row, col, val);
    setCustomMatrix(updated);
  };

  const handleWealthConfigChange = (key: string, val: number) => {
    setWealthConfig(prev => ({ ...prev, [key]: val }));
  };

  if (!result) return <div className="flex h-screen items-center justify-center bg-white text-gray-900">正在初始化...</div>;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-red-500/30">
      
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-20 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col xl:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Activity className="text-red-600" size={28} />
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-tight whitespace-nowrap">
                马尔可夫 & 蝴蝶效应
              </h1>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full no-scrollbar">
            <TabButton active={activeTab === 'guide'} onClick={() => setActiveTab('guide')} icon={<BookOpen size={16} />} label="指南" />
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <TabButton active={activeTab === 'structure'} onClick={() => setActiveTab('structure')} icon={<Settings2 size={16} />} label="M1:架构" />
            <TabButton active={activeTab === 'simulation'} onClick={() => setActiveTab('simulation')} icon={<Clock size={16} />} label="M2:时间" />
            <TabButton active={activeTab === 'steady'} onClick={() => setActiveTab('steady')} icon={<Anchor size={16} />} label="M3:稳态" />
            <TabButton active={activeTab === 'convergence'} onClick={() => setActiveTab('convergence')} icon={<Zap size={16} />} label="M4:收敛" />
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <TabButton active={activeTab === 'trap'} onClick={() => setActiveTab('trap')} icon={<Lock size={16} />} label="M5:陷阱" />
            <TabButton active={activeTab === 'evolution'} onClick={() => setActiveTab('evolution')} icon={<Rocket size={16} />} label="M6:演化" />
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <TabButton active={activeTab === 'path'} onClick={() => setActiveTab('path')} icon={<Route size={16} />} label="M7:路径" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* GUIDE TAB */}
        {activeTab === 'guide' && <Guide />}
        
        {/* MODULE 1-4 (Keep existing implementation logic hidden here for brevity, referencing components) */}
        {activeTab === 'structure' && (
          <div className="h-[calc(100vh-140px)] grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
             <div className="lg:col-span-2 flex flex-col gap-4">
              <MarkovGraph matrix={customMatrix} />
             </div>
             <div className="lg:col-span-1 h-full">
              <MatrixEditor matrix={customMatrix} onUpdate={handleMatrixUpdate} />
            </div>
          </div>
        )}

        {activeTab === 'simulation' && (
           <div className="space-y-6 animate-in fade-in">
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <ControlSlider label="每日改进" value={impactFactor} setValue={setImpactFactor} min={0} max={0.05} step={0.001} displayValue={`+${(impactFactor*100).toFixed(1)}%`} highlight />
                <ControlSlider label="模拟时长" value={simulationYears} setValue={setSimulationYears} min={1} max={50} step={1} displayValue={`${simulationYears} 年`} />
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DivergenceChart data={result.timeline} />
                <DistributionChart baselineDist={result.baselineFinalDist} habitDist={result.habitFinalDist} />
             </div>
           </div>
        )}

        {activeTab === 'steady' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            <div className="lg:col-span-2"><StackedAreaChart data={result.timeline} /></div>
            <div className="lg:col-span-1"><MatrixEditor matrix={customMatrix} onUpdate={handleMatrixUpdate} /></div>
          </div>
        )}

        {activeTab === 'convergence' && convResult && (
           <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-4 rounded-xl border border-gray-200 max-w-lg mx-auto">
                 <ControlSlider label="流动性因子 m" value={mobilityFactor} setValue={setMobilityFactor} min={0.01} max={0.99} step={0.01} displayValue={mobilityFactor.toFixed(2)} highlight />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ConvergenceChart data={convResult.tvdData} />
                 <EigenvalueChart lambda2={convResult.lambda2} />
              </div>
           </div>
        )}

        {/* MODULE 5: POVERTY TRAP (Phase Diagram) */}
        {activeTab === 'trap' && wealthResult && (
          <div className="h-[calc(100vh-140px)] grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Left: Visualization */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <PhaseDiagram 
                data={wealthResult.phaseData} 
                equilibria={wealthResult.equilibria} 
                cobwebPath={wealthResult.cobwebPath} 
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="font-bold text-gray-900 text-sm mb-2">稳定均衡点 (Stable)</h4>
                  <div className="flex gap-2 flex-wrap">
                    {wealthResult.equilibria.filter(e => e.type === 'Stable').map((e, i) => (
                      <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-mono font-bold">
                        k* = {e.k.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="font-bold text-gray-900 text-sm mb-2">不稳定阈值 (Unstable)</h4>
                  <div className="flex gap-2 flex-wrap">
                    {wealthResult.equilibria.filter(e => e.type === 'Unstable').map((e, i) => (
                      <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-mono font-bold">
                        k_trap = {e.k.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="lg:col-span-1 bg-gray-50 p-6 rounded-xl border border-gray-200 overflow-y-auto custom-scrollbar space-y-6">
              <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2">模型参数 (Parameters)</h3>
              
              <ControlSlider 
                label="生产率 (A)" value={wealthConfig.A} setValue={(v: number) => handleWealthConfigChange('A', v)} 
                min={1} max={15} step={0.5} displayValue={wealthConfig.A} 
              />
              <ControlSlider 
                label="储蓄率 (s)" value={wealthConfig.s} setValue={(v: number) => handleWealthConfigChange('s', v)} 
                min={0.05} max={0.6} step={0.01} displayValue={wealthConfig.s} 
              />
              <ControlSlider 
                label="门槛参数 (H)" value={wealthConfig.H} setValue={(v: number) => handleWealthConfigChange('H', v)} 
                min={1} max={20} step={0.5} displayValue={wealthConfig.H} 
              />
               <ControlSlider 
                label="非凸性形状 (γ)" value={wealthConfig.gamma} setValue={(v: number) => handleWealthConfigChange('gamma', v)} 
                min={1.5} max={8} step={0.5} displayValue={wealthConfig.gamma} 
              />
               <ControlSlider 
                label="折旧率 (δ)" value={wealthConfig.delta} setValue={(v: number) => handleWealthConfigChange('delta', v)} 
                min={0.01} max={0.3} step={0.01} displayValue={wealthConfig.delta} 
              />
            </div>
          </div>
        )}

        {/* MODULE 6: DYNAMIC EVOLUTION */}
        {activeTab === 'evolution' && wealthResult && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Controls */}
             <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-6">
                <ControlSlider 
                  label="初始资本 (Initial K)" value={wealthConfig.initialK} setValue={(v: number) => handleWealthConfigChange('initialK', v)} 
                  min={0} max={20} step={0.5} displayValue={wealthConfig.initialK} 
                />
                <ControlSlider 
                  label="随机冲击 (Sigma)" value={wealthConfig.sigma} setValue={(v: number) => handleWealthConfigChange('sigma', v)} 
                  min={0} max={2} step={0.1} displayValue={wealthConfig.sigma} 
                />
                <ControlSlider 
                  label="大推动力度 (Push)" value={wealthConfig.pushMagnitude} setValue={(v: number) => handleWealthConfigChange('pushMagnitude', v)} 
                  min={0} max={10} step={0.5} displayValue={wealthConfig.pushMagnitude} highlight
                />
                 <div className="flex flex-col justify-end">
                  <button 
                    onClick={() => {
                       setWealthConfig(prev => ({...prev})); 
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Rocket size={16} /> 重新模拟
                  </button>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-6">
                <WealthSimulationChart 
                  trajectories={wealthResult.trajectories} 
                  equilibria={wealthResult.equilibria}
                  pushTime={wealthConfig.pushTime}
                />
             </div>
           </div>
        )}

        {/* MODULE 7: PATH DEPENDENCE */}
        {activeTab === 'path' && pathResult && (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
                <ControlSlider 
                  label="努力程度 (Effort)" value={pathConfig.effort} setValue={(v: number) => setPathConfig(p => ({...p, effort: v}))} 
                  min={0} max={1} step={0.05} displayValue={`${(pathConfig.effort*100).toFixed(0)}%`} highlight
                />
                <ControlSlider 
                  label="冒险/激进 (Risk)" value={pathConfig.risk} setValue={(v: number) => setPathConfig(p => ({...p, risk: v}))} 
                  min={0} max={1} step={0.05} displayValue={`${(pathConfig.risk*100).toFixed(0)}%`} 
                />
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">锁定成功 (Absorbing State)</span>
                  </div>
                  <label className="flex items-center cursor-pointer gap-3 p-2 bg-white rounded-lg border border-gray-200">
                    <input 
                      type="checkbox" 
                      checked={pathConfig.isAbsorbing}
                      onChange={(e) => setPathConfig(p => ({...p, isAbsorbing: e.target.checked}))}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">一旦达到巅峰，永不跌落</span>
                  </label>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 h-[400px]">
                     <h3 className="text-lg font-bold text-gray-900 mb-2">动态网络拓扑</h3>
                     <MarkovGraph matrix={pathResult.matrix} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <MetricCard 
                        label="期望登顶步数 (Expected Steps)" 
                        value={pathResult.expectedStepsToAbsorb ? `~${pathResult.expectedStepsToAbsorb.toFixed(1)} 步` : "N/A (非吸收态)"} 
                        highlight={!!pathResult.expectedStepsToAbsorb}
                     />
                     <MetricCard 
                        label="最高阶层最终占比 (P_steady)" 
                        value={`${(pathResult.finalDist[4] * 100).toFixed(1)}%`} 
                     />
                  </div>
               </div>
               <div className="lg:col-span-1 space-y-6">
                  <FinalDistPieChart data={pathResult.finalDist} />
                  <MatrixGrid matrix={pathResult.matrix} title="生成的参数化矩阵" />
               </div>
             </div>
           </div>
        )}

      </main>
    </div>
  );
}

// --- Helper Components ---
const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
      active ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
    }`}
  >
    {icon}
    {label}
  </button>
);

const ControlSlider = ({ label, value, setValue, min, max, step, displayValue, highlight }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
        {label}
      </span>
      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${highlight ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
        {displayValue}
      </span>
    </div>
    <input 
      type="range" 
      min={min} max={max} step={step} 
      value={value}
      onChange={(e) => setValue(parseFloat(e.target.value))}
      className={`w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer ${highlight ? 'accent-blue-600' : 'accent-gray-600'}`}
    />
  </div>
);

const MetricCard = ({ label, value, highlight }: any) => (
  <div className={`p-6 rounded-xl border shadow-sm ${highlight ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'}`}>
    <p className={`text-xs font-bold uppercase ${highlight ? 'text-blue-500' : 'text-gray-500'}`}>{label}</p>
    <div className={`mt-1 text-2xl font-black ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>{value}</div>
  </div>
);