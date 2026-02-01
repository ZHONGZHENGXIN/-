import React from 'react';
import { BookOpen, Activity, Lock, TrendingUp, Zap, Route, MousePointerClick } from 'lucide-react';

const Guide = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* Intro Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-lg text-white">
        <h2 className="text-3xl font-black mb-4 flex items-center gap-3">
          <BookOpen size={32} />
          马尔可夫人生模拟器：新手指南
        </h2>
        <p className="text-blue-100 text-lg leading-relaxed max-w-3xl">
          欢迎来到数学与人生的交叉路口。本应用利用<strong>复杂系统</strong>理论，将人生建模为一个动态的概率过程。
          在这里，你可以直观地看到：微小的习惯如何通过复利改变命运，贫困陷阱是如何形成的，以及运气在其中的作用。
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Module 1-3: Markov Basics */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 text-red-600">
            <Activity size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">1. 微习惯的复利 (M1-M3)</h3>
          <p className="text-sm text-gray-500 mb-4 font-mono">关键词：转移矩阵、稳态、蝴蝶效应</p>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              人生被简化为 5 个层级（State 0-4）。你现在的状态决定了明天的概率分布。
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>M1 架构：</strong> 查看底层的“转移矩阵”。这是系统的规则书。</li>
              <li><strong>M2 模拟：</strong> 尝试调整 <span className="bg-gray-100 px-1 py-0.5 rounded font-bold text-gray-800">每日改进 (Impact)</span>。你会发现，仅仅 1% 的概率提升，在 10 年（3650步）的复利下，会让“概率锥”张开巨大的口子。这就是数学上的蝴蝶效应。</li>
              <li><strong>M3 稳态：</strong> 长期来看，无论起点在哪，你的命运分布都会收敛到一个固定的“终局”。</li>
            </ul>
          </div>
        </div>

        {/* Module 4: Convergence */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 text-yellow-600">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">2. 阶层流动的速度 (M4)</h3>
          <p className="text-sm text-gray-500 mb-4 font-mono">关键词：谱隙、特征值、混合时间</p>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              为什么有些社会或习惯一旦形成就很难改变？这取决于<strong>谱隙 (Spectral Gap)</strong>。
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>流动性因子 m：</strong> 调节滑块。当 m 很小时，社会是“粘性”的，改变极慢。</li>
              <li><strong>特征值 λ2：</strong> 观察红点距离圆心的位置。它越靠近圆心（0），代表旧状态被遗忘得越快，你越容易重塑自我。</li>
            </ul>
          </div>
        </div>

        {/* Module 5-6: Poverty Trap */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 text-orange-600">
            <Lock size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">3. 逃离贫困陷阱 (M5-M6)</h3>
          <p className="text-sm text-gray-500 mb-4 font-mono">关键词：非凸性、S型曲线、阈值</p>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              财富积累不是线性的。在资本极低时，折旧（消耗）往往大于产出，导致自动贫困化。
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>M5 陷阱：</strong> 寻找相位图中的<strong>红色空心点</strong>。那是生死分界线。低于此点，系统自动滑落谷底。</li>
              <li><strong>M6 演化：</strong> 尝试使用 <span className="bg-gray-100 px-1 py-0.5 rounded font-bold text-gray-800">大推动 (Push)</span>。模拟一次性的大额投入（如教育、迁徙），看它如何帮你跃过阈值，进入指数增长区。</li>
            </ul>
          </div>
        </div>

        {/* Module 7: Path Dependence */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 text-green-600">
            <Route size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">4. 路径依赖与锁定 (M7)</h3>
          <p className="text-sm text-gray-500 mb-4 font-mono">关键词：吸收态、方差、期望步数</p>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              选择不仅改变结果，还改变了未来的选择空间。
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>努力 vs 冒险：</strong> “努力”线性增加向上概率，“冒险”则增加波动性（可能大成，也可能大败）。</li>
              <li><strong>吸收态：</strong> 勾选“锁定成功”。这模拟了某些不可逆的成就（如终身教职、财务自由）。一旦进入该状态，概率变成 100%，你将永远留在巅峰。</li>
            </ul>
          </div>
        </div>

      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-gray-600 mb-4">
          准备好开始探索了吗？点击上方的标签页开始模拟。
        </p>
        <div className="flex justify-center gap-2 text-sm font-bold text-gray-400">
           <span className="flex items-center gap-1"><MousePointerClick size={16}/> 提示：所有的图表都是可交互的，尝试拖动滑块观察实时变化。</span>
        </div>
      </div>

    </div>
  );
};

export default Guide;