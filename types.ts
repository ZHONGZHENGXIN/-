export type Vector = number[];
export type Matrix = number[][];

export interface SimulationConfig {
  years: number;
  impactFactor: number; // The "butterfly effect" epsilon (0.00 to 0.05)
  initialState: number; // The starting state index (0-4)
}

export interface SimulationStep {
  day: number;
  baselineExpectedValue: number;
  habitExpectedValue: number;
  // Full probability distributions for detailed trajectory plotting
  baselineDist: Vector;
  habitDist: Vector;
}

export interface SimulationResult {
  timeline: SimulationStep[];
  baselineFinalDist: Vector;
  habitFinalDist: Vector;
  baselineMatrix: Matrix;
  habitMatrix: Matrix;
  spectralGap: number;
  mixingTime: number;
  probabilityImprovement: number;
  // For Module 3: Theoretical Steady State
  steadyState: Vector;
}

export interface ConvergenceDataPoint {
  step: number;
  tvd: number; // Total Variation Distance
  theoreticalBound: number; // C * |lambda_2|^t
}

export interface ConvergenceResult {
  mobilityFactor: number;
  eigenvalues: number[]; // For the specific mobility matrix
  spectralGap: number;
  lambda2: number;
  tvdData: ConvergenceDataPoint[];
}

// --- Modules 5 & 6: Wealth Dynamics Types ---

export interface WealthConfig {
  A: number;     // Productivity (Tech level)
  s: number;     // Savings rate
  H: number;     // Human capital threshold (shift parameter)
  gamma: number; // Shape parameter (non-convexity)
  delta: number; // Depreciation rate
  sigma: number; // Random shock (std dev)
  initialK: number; // Initial capital mean
  pushMagnitude: number; // Big Push policy shock
  pushTime: number;      // Time step when policy occurs
}

export interface Equilibrium {
  k: number;
  type: 'Stable' | 'Unstable';
}

export interface PhaseDiagramDataPoint {
  k: number;
  nextK: number; // f(k)
  depreciation: number; // Break-even line (usually just k, or k * delta depending on plot type)
}

export interface WealthTrajectoryPoint {
  step: number;
  [key: string]: number; // dynamic keys for multiple paths: "path0", "path1"...
}

export interface WealthSimulationResult {
  equilibria: Equilibrium[];
  phaseData: PhaseDiagramDataPoint[];
  trajectories: WealthTrajectoryPoint[];
  cobwebPath: {k: number, nextK: number}[];
}

// --- Module 7: Path Dependence Types ---

export interface PathConfig {
  effort: number; // 0.0 - 1.0: Increases P(i -> i+1)
  risk: number;   // 0.0 - 1.0: Increases P(i -> i+2) AND P(i -> i-1)
  isAbsorbing: boolean; // If true, State 4 becomes absorbing (P_44 = 1)
}

export interface PathResult {
  matrix: Matrix;
  finalDist: Vector;
  expectedStepsToAbsorb: number | null; // Null if not absorbing or reachable
  absorptionProbabilities: Vector | null; // Probability of being absorbed into specific states
}

export enum LifeState {
  Stuck = 0,
  Struggling = 1,
  Stable = 2,
  Thriving = 3,
  SelfActualized = 4
}

export const STATE_LABELS = {
  [LifeState.Stuck]: "陷入困境/停滞",
  [LifeState.Struggling]: "挣扎/不稳定",
  [LifeState.Stable]: "稳定/舒适区",
  [LifeState.Thriving]: "蓬勃发展/进阶",
  [LifeState.SelfActualized]: "自我实现/卓越",
};

export const STATE_COLORS = [
  "#64748b", // Slate 500
  "#f97316", // Orange 500
  "#eab308", // Yellow 500
  "#10b981", // Emerald 500
  "#8b5cf6", // Violet 500
];