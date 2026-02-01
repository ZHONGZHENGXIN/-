import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Info, Wind, Waves, FlaskConical, Gauge, Zap, Activity } from 'lucide-react';
import { PhysicsSystemType, PhysicsConfig, PhysicsState } from '../types';
import { initPhysics, stepPhysics } from '../services/physicsService';

const GRID_W = 80; // Low res for performance (BZ/Convection)
const GRID_H = 60;

interface Props {}

const PhysicsSimulator: React.FC<Props> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const stateRef = useRef<PhysicsState | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [systemType, setSystemType] = useState<PhysicsSystemType>('bz_reaction');
  const [entropyHistory, setEntropyHistory] = useState<number[]>([]);
  
  const [config, setConfig] = useState<PhysicsConfig>({
    inputEnergy: 0.5,
    dissipation: 0.2,
    randomness: 0.1
  });

  // --- Rendering Logic ---
  const draw = (ctx: CanvasRenderingContext2D, state: PhysicsState) => {
      const { width, height } = ctx.canvas;
      ctx.clearRect(0, 0, width, height);

      if (systemType === 'hurricane' && state.particles) {
          // Draw Particles
          // Dark Ocean Background
          const oceanGradient = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, width/2);
          oceanGradient.addColorStop(0, '#0f172a');
          oceanGradient.addColorStop(1, '#1e293b');
          ctx.fillStyle = oceanGradient;
          ctx.fillRect(0, 0, width, height);

          state.particles.forEach(p => {
              const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
              ctx.beginPath();
              ctx.arc(p.x, p.y, 1.5 + (p.temp * 2), 0, Math.PI * 2);
              // Color based on speed/temp
              const alpha = Math.min(1, 0.3 + p.temp);
              ctx.fillStyle = `rgba(200, 230, 255, ${alpha})`;
              if (speed > 2) ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.fill();
          });
          
          // Draw "Eye"
          ctx.beginPath();
          ctx.arc(width/2, height/2, 10, 0, Math.PI*2);
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.stroke();

      } else if (state.grid) {
          // Draw Grid
          const cellW = width / GRID_W;
          const cellH = height / GRID_H;
          const data = state.grid;

          for (let y = 0; y < GRID_H; y++) {
              for (let x = 0; x < GRID_W; x++) {
                  let r, g, b;
                  
                  if (systemType === 'bz_reaction') {
                      const idx = (y * GRID_W + x) * 2;
                      const chemA = data[idx];
                      const chemB = data[idx+1];
                      // Visualizing B concentration primarily
                      // Red/Black/White pattern
                      const val = Math.floor(chemB * 255);
                      const valA = Math.floor(chemA * 255);
                      r = val * 2;
                      g = valA * 0.5;
                      b = val * 0.5;
                  } else { // Convection
                      const idx = (y * GRID_W + x) * 4;
                      const temp = data[idx];
                      // Heat Map: Blue (Cold) -> Red (Hot)
                      r = Math.min(255, temp * 350);
                      b = Math.min(255, (1 - temp) * 350);
                      g = 50;
                  }

                  ctx.fillStyle = `rgb(${r},${g},${b})`;
                  ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
              }
          }
      }
  };

  const loop = () => {
      if (!stateRef.current) return;
      
      if (isPlaying) {
         const w = systemType === 'hurricane' ? canvasRef.current?.width || 400 : GRID_W;
         const h = systemType === 'hurricane' ? canvasRef.current?.height || 300 : GRID_H;
         
         // In physics service, we treat w/h as simulation logical size
         stateRef.current = stepPhysics(stateRef.current, config, systemType);
         
         // Update entropy graph occasionally
         if (stateRef.current.stepCount % 10 === 0) {
             setEntropyHistory(prev => {
                 const newVal = 1.0 - calculatePseudoEntropy(stateRef.current!); // Mapping to "Structure"
                 const next = [...prev, newVal];
                 if (next.length > 50) next.shift();
                 return next;
             });
         }
      }

      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) draw(ctx, stateRef.current);
      }
      
      requestRef.current = requestAnimationFrame(loop);
  };

  // Helper for graph
  const calculatePseudoEntropy = (state: PhysicsState) => {
      // Just a visual proxy to drive the chart
      // Real thermodynamic entropy calculation is too heavy here
      if (systemType === 'bz_reaction') {
          return 0.5 + Math.sin(state.stepCount * 0.05) * 0.1; // Oscillates
      }
      return 0.5; 
  };

  // --- Effects ---
  useEffect(() => {
      const w = systemType === 'hurricane' ? 600 : GRID_W;
      const h = systemType === 'hurricane' ? 400 : GRID_H;
      stateRef.current = initPhysics(w, h, systemType);
      setEntropyHistory(Array(50).fill(0.5)); // Reset graph
      // Reset config to defaults per type
      if (systemType === 'bz_reaction') setConfig({ inputEnergy: 0.5, dissipation: 0.2, randomness: 0.05 });
      if (systemType === 'convection') setConfig({ inputEnergy: 0.6, dissipation: 0.5, randomness: 0.1 });
      if (systemType === 'hurricane') setConfig({ inputEnergy: 0.7, dissipation: 0.1, randomness: 0.2 });
  }, [systemType]);

  useEffect(() => {
      requestRef.current = requestAnimationFrame(loop);
      return () => {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
  }, [isPlaying, config, systemType]); // Restart loop on changes? No, loop ref handles it. Dependencies mainly for safety.

  // --- Handlers ---
  const reset = () => {
       const w = systemType === 'hurricane' ? 600 : GRID_W;
       const h = systemType === 'hurricane' ? 400 : GRID_H;
       stateRef.current = initPhysics(w, h, systemType);
       setEntropyHistory([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        
        {/* Top Controls: System Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SystemCard 
                active={systemType === 'bz_reaction'} 
                onClick={() => setSystemType('bz_reaction')}
                icon={<FlaskConical />}
                title="化学振荡 (BZ)"
                desc="自组织的时空斑图"
            />
            <SystemCard 
                active={systemType === 'convection'} 
                onClick={() => setSystemType('convection')}
                icon={<Waves />}
                title="贝纳德对流"
                desc="热量驱动的蜂窝结构"
            />
            <SystemCard 
                active={systemType === 'hurricane'} 
                onClick={() => setSystemType('hurricane')}
                icon={<Wind />}
                title="飓风模拟"
                desc="旋转与能量耗散"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Visualization Canvas */}
            <div className="lg:col-span-2 space-y-4">
                <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-700 aspect-[3/2]">
                    <canvas 
                        ref={canvasRef} 
                        width={600} 
                        height={400} 
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay Controls */}
                    <div className="absolute bottom-4 left-4 flex gap-2">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 bg-white/10 backdrop-blur hover:bg-white/20 rounded-full text-white transition-all">
                            {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
                        </button>
                        <button onClick={reset} className="p-2 bg-white/10 backdrop-blur hover:bg-white/20 rounded-full text-white transition-all">
                            <RotateCcw size={20}/>
                        </button>
                    </div>

                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur px-3 py-1 rounded-full text-xs text-white border border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        耗散系统运行中
                    </div>
                </div>

                {/* Entropy / Order Graph (Simplified) */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 h-32 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                           <Activity size={14}/> 系统有序度 (Structure Index)
                        </h4>
                        <span className="text-xs text-gray-400">Low Entropy = High Structure</span>
                    </div>
                    <div className="flex-1 flex items-end gap-1">
                        {entropyHistory.map((val, i) => (
                            <div 
                                key={i} 
                                className="flex-1 bg-blue-500 opacity-50 rounded-t-sm transition-all duration-300"
                                style={{ height: `${val * 100}%` }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Controls & Education */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Parameter Sliders */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
                    <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                        <SettingsSliderIcon type={systemType} /> 实验参数
                    </h3>
                    
                    <ControlSlider 
                        label={getLabel(systemType, 'energy')}
                        value={config.inputEnergy}
                        setValue={(v: number) => setConfig(c => ({...c, inputEnergy: v}))}
                        color="text-orange-600"
                    />
                    <ControlSlider 
                        label={getLabel(systemType, 'dissipation')}
                        value={config.dissipation}
                        setValue={(v: number) => setConfig(c => ({...c, dissipation: v}))}
                        color="text-blue-600"
                    />
                    <ControlSlider 
                        label="随机扰动 (Noise)"
                        value={config.randomness}
                        setValue={(v: number) => setConfig(c => ({...c, randomness: v}))}
                        color="text-gray-600"
                    />

                    {/* Quick Experiments */}
                    <div className="pt-4 border-t border-gray-200">
                        <span className="text-xs font-bold text-gray-400 block mb-2">预设实验</span>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setConfig({inputEnergy: 0.2, dissipation: 0.8, randomness: 0.1})} className="px-2 py-1 text-xs bg-white border hover:bg-gray-50 rounded">
                                低能态 (死寂)
                            </button>
                            <button onClick={() => setConfig({inputEnergy: 0.8, dissipation: 0.1, randomness: 0.2})} className="px-2 py-1 text-xs bg-white border hover:bg-gray-50 rounded">
                                混沌态 (Chaos)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Educational Context */}
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 text-blue-900">
                     <div className="flex items-start gap-3">
                         <Info className="shrink-0 text-blue-600 mt-1" size={20} />
                         <div>
                             <h4 className="font-bold text-sm mb-1">物理原理：耗散结构</h4>
                             <p className="text-xs opacity-90 leading-relaxed">
                                 {getExplanation(systemType)}
                             </p>
                             <div className="mt-3 text-xs font-bold bg-blue-100 inline-block px-2 py-1 rounded text-blue-700">
                                 能量输入 + 耗散 = 有序
                             </div>
                         </div>
                     </div>
                </div>

            </div>
        </div>
    </div>
  );
};

// --- Subcomponents & Helpers ---

const SystemCard = ({ active, onClick, icon, title, desc }: any) => (
    <button 
        onClick={onClick}
        className={`p-4 rounded-xl border text-left transition-all duration-200 group ${
            active 
            ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]' 
            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
        }`}
    >
        <div className={`mb-3 ${active ? 'text-white' : 'text-blue-600 group-hover:scale-110 transition-transform'}`}>
            {icon}
        </div>
        <h3 className="font-bold text-sm">{title}</h3>
        <p className={`text-xs mt-1 ${active ? 'text-blue-100' : 'text-gray-400'}`}>{desc}</p>
    </button>
);

const ControlSlider = ({ label, value, setValue, color }: any) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold">
            <span className={color}>{label}</span>
            <span className="font-mono">{value.toFixed(2)}</span>
        </div>
        <input 
            type="range" min="0" max="1" step="0.01"
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-800"
        />
    </div>
);

const SettingsSliderIcon = ({type}: {type: PhysicsSystemType}) => {
    if (type === 'convection') return <Zap size={16} className="inline text-orange-500"/>;
    return <Gauge size={16} className="inline text-gray-700"/>;
};

const getLabel = (type: PhysicsSystemType, param: 'energy' | 'dissipation') => {
    if (param === 'energy') {
        if (type === 'convection') return "加热强度 (Heat Input)";
        if (type === 'bz_reaction') return "进料速率 (Feed Rate)";
        if (type === 'hurricane') return "海洋热能 (Thermal Energy)";
    }
    if (param === 'dissipation') {
        if (type === 'convection') return "流体粘度 (Viscosity)";
        if (type === 'bz_reaction') return "反应耗散 (Kill Rate)";
        if (type === 'hurricane') return "摩擦阻力 (Friction)";
    }
    return "Unknown";
};

const getExplanation = (type: PhysicsSystemType) => {
    if (type === 'convection') return "当液体底部受热时，热胀冷缩导致流体上升。只有当温差超过临界值时，系统才会自发打破对称性，形成规则的六边形对流胞（Bénard Cells），以最大效率传输热量。";
    if (type === 'bz_reaction') return "这是一个远离平衡态的化学系统。反应物不断输入，产物不断耗散。在特定参数下，系统不会达到均匀混合的平衡态，而是产生持续震荡的斑图（图灵斑图）。";
    if (type === 'hurricane') return "飓风是一个巨大的热机。它从温暖的海洋表面吸收热能（低熵），在高空辐射冷却（高熵）。这种能量流维持了巨大的有序旋转结构，直到登陆后失去能量输入而消散。";
    return "";
};

export default PhysicsSimulator;