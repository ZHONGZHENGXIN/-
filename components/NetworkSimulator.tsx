import React, { useRef, useEffect, useState } from 'react';
import { NetworkConfig, NetworkState, NetNode, NetLink } from '../types';
import { initNetwork, addPreferentialNode, updateForceLayout } from '../services/networkService';
import { Play, Pause, RotateCcw, Share2, Plus, Zap } from 'lucide-react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label 
} from 'recharts';

const NetworkSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const stateRef = useRef<NetworkState | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [config, setConfig] = useState<NetworkConfig>({
    initialNodes: 3,
    newEdges: 1, // m
    attractiveness: 0, // A
    speed: 100, // ms
    layoutForce: 1
  });
  
  // For UI updates (stats & chart)
  const [uiState, setUiState] = useState<{nodeCount: number, step: number, degreeDist: any[]}>({
      nodeCount: 0, 
      step: 0,
      degreeDist: []
  });

  const lastAddRef = useRef<number>(0);

  // --- Draw Function ---
  const draw = (ctx: CanvasRenderingContext2D, state: NetworkState) => {
      const { width, height } = ctx.canvas;
      
      // Clear with darkish background
      ctx.fillStyle = '#111827'; // Tailwind gray-900
      ctx.fillRect(0, 0, width, height);

      // Draw Links
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(107, 114, 128, 0.4)'; // gray-500
      ctx.beginPath();
      state.links.forEach(link => {
          const u = state.nodes[link.source];
          const v = state.nodes[link.target];
          if (u && v) {
              ctx.moveTo(u.x, u.y);
              ctx.lineTo(v.x, v.y);
          }
      });
      ctx.stroke();

      // Draw Nodes
      state.nodes.forEach(node => {
          // Radius based on Degree (k)
          const r = 4 + Math.sqrt(node.degree) * 1.5;
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          
          // Color based on Fitness (eta)
          // Low Fitness = Blue, High Fitness = Red
          if (node.isNew) {
              ctx.fillStyle = '#22c55e'; // Green-500 for just-born (1 frame)
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 2;
          } else {
              const fitness = node.fitness || 0.5;
              // Interpolate Blue (59, 130, 246) -> Red (239, 68, 68)
              const rVal = Math.floor(59 + fitness * (239 - 59));
              const gVal = Math.floor(130 + fitness * (68 - 130));
              const bVal = Math.floor(246 + fitness * (68 - 246));
              
              ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
              ctx.strokeStyle = `rgba(255,255,255,0.4)`;
              ctx.lineWidth = 1;
          }
          
          ctx.fill();
          ctx.stroke();

          // Draw ID on Hubs
          if (node.degree > 10) {
             ctx.fillStyle = 'white';
             ctx.font = '10px sans-serif';
             ctx.fillText(node.degree.toString(), node.x - 4, node.y + 3);
          }
      });
  };

  // --- Animation Loop ---
  const loop = (timestamp: number) => {
      if (!stateRef.current) return;
      const state = stateRef.current;
      const { width, height } = canvasRef.current || { width: 600, height: 400 };

      // 1. Physics Step (Always run layout for smoothness)
      updateForceLayout(state, width, height);

      // 2. Logic Step (Add node)
      if (isPlaying) {
          if (timestamp - lastAddRef.current > config.speed) {
              if (state.nodes.length < 500) { // Limit for browser performance
                  const newState = addPreferentialNode(state, config, width, height);
                  stateRef.current = newState;
                  
                  // Update UI React state less frequently to avoid lag
                  setUiState({
                      nodeCount: newState.nodes.length,
                      step: newState.step,
                      degreeDist: newState.degreeDist
                  });
              } else {
                  setIsPlaying(false); // Auto stop
              }
              lastAddRef.current = timestamp;
          }
      }

      // 3. Render
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) draw(ctx, state);
      }

      requestRef.current = requestAnimationFrame(loop);
  };

  // --- Init ---
  const reset = () => {
      const w = canvasRef.current?.width || 600;
      const h = canvasRef.current?.height || 400;
      const newState = initNetwork(w, h, config);
      stateRef.current = newState;
      setUiState({
          nodeCount: newState.nodes.length,
          step: newState.step,
          degreeDist: newState.degreeDist
      });
      setIsPlaying(false);
  };

  useEffect(() => {
      if (!stateRef.current) reset();
      requestRef.current = requestAnimationFrame(loop);
      return () => {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
  }, [isPlaying, config]);

  // --- Render Component ---
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        
      {/* Header / Stats */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
         <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                 <Share2 size={24} />
             </div>
             <div>
                 <h2 className="text-lg font-bold text-gray-900">增强版优先链接 (Bianconi-Barabási)</h2>
                 <p className="text-xs text-gray-500">引入“适应度”与“初始欢迎度”：天赋异禀者能否后来居上？</p>
             </div>
         </div>
         <div className="flex gap-4 mt-3 md:mt-0 text-sm font-mono">
             <div className="bg-gray-100 px-3 py-1 rounded">
                 节点: <span className="font-bold text-indigo-600">{uiState.nodeCount}</span>
             </div>
             <div className="bg-gray-100 px-3 py-1 rounded">
                 最大度: <span className="font-bold text-indigo-600">
                    {stateRef.current ? Math.max(...stateRef.current.nodes.map(n=>n.degree)) : 0}
                 </span>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Visualization */}
          <div className="lg:col-span-2 space-y-4">
              <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700 aspect-[16/10]">
                  <canvas 
                      ref={canvasRef} 
                      width={800} 
                      height={500} 
                      className="w-full h-full object-cover cursor-crosshair"
                  />
                  
                  {/* Overlay Controls */}
                  <div className="absolute bottom-4 left-4 flex gap-2">
                      <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 rounded-full text-white transition-all ${isPlaying ? 'bg-red-500/80 hover:bg-red-600' : 'bg-green-500/80 hover:bg-green-600'}`}>
                          {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
                      </button>
                      <button onClick={reset} className="p-2 bg-white/10 backdrop-blur hover:bg-white/20 rounded-full text-white transition-all">
                          <RotateCcw size={20}/>
                      </button>
                  </div>

                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-2 rounded-lg text-xs text-white border border-white/10">
                      <div className="mb-2 font-bold border-b border-white/20 pb-1">节点颜色 (适应度 η)</div>
                      <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div> 高适应度 (天赋高)
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div> 低适应度 (天赋低)
                      </div>
                      <div className="mt-2 font-bold border-b border-white/20 pb-1">节点大小</div>
                      <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gray-400"></div> 度数 (连接数 k)
                      </div>
                  </div>
              </div>
          </div>

          {/* Right Panel: Controls & Charts */}
          <div className="lg:col-span-1 space-y-6">
              
              {/* Controls */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-5">
                  <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <Zap size={16} className="text-yellow-600"/> 模拟参数
                  </h3>
                  
                  <Slider 
                      label="每次连接边数 (m)" 
                      value={config.newEdges} 
                      onChange={(v) => {
                          setConfig(c => ({...c, newEdges: v}));
                          reset(); 
                      }}
                      min={1} max={5} step={1}
                      desc="每个新加入节点连接的旧节点数量。"
                  />

                  <Slider 
                      label="初始欢迎度 (A)" 
                      value={config.attractiveness} 
                      onChange={(v) => {
                           setConfig(c => ({...c, attractiveness: v}));
                           reset();
                      }}
                      min={0} max={10} step={1}
                      desc="赋予所有节点的基础吸引力。A越大，初始优势越不明显，网络越均匀。"
                  />

                  <Slider 
                      label="模拟速度 (ms)" 
                      value={config.speed} 
                      onChange={(v) => setConfig(c => ({...c, speed: v}))}
                      min={10} max={500} step={10}
                      desc="节点加入的时间间隔。越小越快。"
                      inverse 
                  />

                  <div className="p-3 bg-blue-50 text-blue-900 text-xs rounded border border-blue-100 leading-relaxed">
                      <strong>连接概率公式：</strong>
                      <div className="my-3 flex justify-center">
                        <div className="bg-white/60 px-4 py-2 rounded-lg border border-blue-200 text-lg font-serif text-blue-900 shadow-sm">
                            Π<sub>i</sub> ∝ η<sub>i</sub> · (k<sub>i</sub> + A)
                        </div>
                      </div>
                      <span className="opacity-75 block mt-2 text-center">
                          η: 适应度 (天赋), k: 度数, A: 欢迎度
                      </span>
                  </div>
              </div>

              {/* Chart: Degree Distribution */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 h-[300px] flex flex-col">
                  <h3 className="font-bold text-gray-900 text-sm mb-2">度分布 (Log-Log)</h3>
                  <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                  type="number" 
                                  dataKey="degree" 
                                  name="Degree k" 
                                  scale="log" 
                                  domain={['auto', 'auto']}
                                  allowDataOverflow
                                  label={{ value: '度 (k)', position: 'insideBottom', offset: -10, fontSize: 10 }}
                                  tick={{fontSize: 10}}
                              />
                              <YAxis 
                                  type="number" 
                                  dataKey="count" 
                                  name="Count P(k)" 
                                  scale="log" 
                                  domain={['auto', 'auto']}
                                  allowDataOverflow
                                  label={{ value: '频率', angle: -90, position: 'insideLeft', fontSize: 10 }}
                                  tick={{fontSize: 10}}
                              />
                              <Tooltip 
                                  cursor={{ strokeDasharray: '3 3' }} 
                                  contentStyle={{fontSize: '12px'}}
                                  formatter={(value: number, name: string) => [value, name === 'count' ? '节点数' : '度']}
                              />
                              <Scatter name="Nodes" data={uiState.degreeDist.filter(d => d.degree > 0 && d.count > 0)} fill="#4f46e5" shape="circle" />
                          </ScatterChart>
                      </ResponsiveContainer>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

// Helper slider
const Slider = ({ label, value, onChange, min, max, step, desc }: any) => (
  <div className="space-y-2 group">
    <div className="flex justify-between items-center text-sm font-bold text-gray-700">
      <span>{label}</span>
      <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
        {value}
      </span>
    </div>
    <input 
      type="range" min={min} max={max} step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
    />
    <p className="text-[10px] text-gray-400">
       {desc}
    </p>
  </div>
);

export default NetworkSimulator;