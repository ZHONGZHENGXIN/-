import { BayesConfig, BayesResult, BayesScenarioType } from '../types';

export const SCENARIOS: Record<BayesScenarioType, { label: string; desc: string; config: BayesConfig }> = {
  disease: {
    label: "罕见病诊断",
    desc: "即使检测准确率很高，如果疾病非常罕见，阳性结果也可能大概率是误诊。",
    config: {
      prior: 0.01,       // 1% 人口患病
      sensitivity: 0.99, // 99% 的患者能被检测出
      falsePositive: 0.05 // 5% 的健康人会被误报
    }
  },
  spam: {
    label: "垃圾邮件过滤",
    desc: "基于关键词（如“免费”）判断邮件性质。垃圾邮件概率通常较高。",
    config: {
      prior: 0.40,       // 40% 的邮件是垃圾邮件
      sensitivity: 0.95, // 95% 的垃圾邮件包含该词
      falsePositive: 0.02 // 2% 的正常邮件包含该词
    }
  },
  weather: {
    label: "天气预测",
    desc: "结合历史气候数据（先验）和当前气压计读数（证据）更新下雨概率。",
    config: {
      prior: 0.20,       // 今天下雨的先验概率
      sensitivity: 0.90, // 如果下雨，气压计90%概率显示低压
      falsePositive: 0.15 // 如果没雨，气压计15%概率误报低压
    }
  },
  custom: {
    label: "自定义模式",
    desc: "自由调整参数，探索贝叶斯定理的边界。",
    config: {
      prior: 0.5,
      sensitivity: 0.8,
      falsePositive: 0.2
    }
  }
};

export const calculateBayes = (config: BayesConfig): BayesResult => {
  const { prior, sensitivity, falsePositive } = config;
  
  // P(H)
  const p_h = prior;
  // P(~H)
  const p_not_h = 1 - prior;
  
  // P(E|H)
  const p_e_given_h = sensitivity;
  // P(E|~H)
  const p_e_given_not_h = falsePositive;
  
  // Intersection Probabilities (Areas in the visualization)
  // True Positive Area: P(H) * P(E|H)
  const p_e_and_h = p_h * p_e_given_h;
  
  // False Positive Area: P(~H) * P(E|~H)
  const p_e_and_not_h = p_not_h * p_e_given_not_h;
  
  // Total Evidence P(E)
  const p_e = p_e_and_h + p_e_and_not_h;
  
  // Posterior P(H|E) = (True Positive Area) / (Total Evidence Area)
  const posterior = p_e === 0 ? 0 : p_e_and_h / p_e;

  return {
    p_h,
    p_not_h,
    p_e_given_h,
    p_e_given_not_h,
    p_e_and_h,
    p_e_and_not_h,
    p_e,
    posterior
  };
};

export const getInterpretation = (result: BayesResult, type: BayesScenarioType): string => {
  const postPct = (result.posterior * 100).toFixed(1);
  const priorPct = (result.p_h * 100).toFixed(1);
  
  if (type === 'disease') {
    if (result.posterior < 0.5) {
      return `尽管检测结果是阳性，但由于该病非常罕见（先验 ${priorPct}%），你实际上患病的概率只有 ${postPct}%。这就是“基本比率谬误”。`;
    }
    return `检测结果显著提高了患病概率（从 ${priorPct}% 到 ${postPct}%）。建议进行进一步检查。`;
  }
  
  if (type === 'spam') {
    return `如果邮件包含该关键词，它是垃圾邮件的概率更新为 ${postPct}%。`;
  }

  return `收到新证据后，我们将假设成立的信心从 ${priorPct}% 更新到了 ${postPct}%。`;
};