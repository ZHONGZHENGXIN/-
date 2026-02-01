import { Matrix, Vector, SimulationResult, SimulationConfig, LifeState, SimulationStep, ConvergenceResult, ConvergenceDataPoint, PathConfig, PathResult } from '../types';

const STATES_COUNT = 5;

// Helper: Create a deep copy of a matrix
export const cloneMatrix = (m: Matrix): Matrix => m.map(row => [...row]);

// Helper: Normalize a vector to sum to 1
const normalizeRow = (row: Vector): Vector => {
  const sum = row.reduce((a, b) => a + b, 0);
  return sum === 0 ? row : row.map(v => v / sum);
};

// Helper: Matrix x Vector multiplication
const multiplyVectorMatrix = (v: Vector, m: Matrix): Vector => {
  const result = new Array(v.length).fill(0);
  for (let j = 0; j < v.length; j++) {
    for (let i = 0; i < v.length; i++) {
      result[j] += v[i] * m[i][j];
    }
  }
  return result;
};

// Helper: Gaussian Elimination to solve Ax = b
// Used to find Steady State: (P^T - I)x = 0 subject to sum(x)=1
const solveLinearSystem = (A: Matrix, b: Vector): Vector => {
  const n = A.length;
  // Augment Matrix
  const M = A.map((row, i) => [...row, b[i]]);

  // Forward Elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let pivotRow = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(M[j][i]) > Math.abs(M[pivotRow][i])) pivotRow = j;
    }
    // Swap
    [M[i], M[pivotRow]] = [M[pivotRow], M[i]];

    // Normalize pivot row
    const pivotVal = M[i][i];
    if (Math.abs(pivotVal) < 1e-10) continue; // Singular

    for (let j = i; j <= n; j++) M[i][j] /= pivotVal;

    // Eliminate other rows
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = M[k][i];
        for (let j = i; j <= n; j++) M[k][j] -= factor * M[i][j];
      }
    }
  }

  // Back substitution (already diagonalized above mostly)
  return M.map(row => row[n]);
};

// Calculate Theoretical Steady State
export const calculateSteadyState = (matrix: Matrix): Vector => {
  const n = matrix.length;
  // We want to solve xP = x  =>  x(P - I) = 0  => (P^T - I)x^T = 0
  // Constraint: sum(x) = 1
  
  // Construct A = (P^T - I)
  const A: Matrix = Array(n).fill(0).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      A[i][j] = matrix[j][i]; // Transpose
      if (i === j) A[i][j] -= 1; // Subtract Identity
    }
  }

  // Replace the last equation with the constraint sum(x) = 1 to enforce scale
  // This avoids the trivial solution x=0
  for (let j = 0; j < n; j++) {
    A[n - 1][j] = 1;
  }
  
  const b = Array(n).fill(0);
  b[n - 1] = 1;

  return solveLinearSystem(A, b);
};


// Helper: Calculate Expected Value (Weighted Average of State Indices)
const calculateExpectedValue = (dist: Vector): number => {
  return dist.reduce((sum, prob, index) => sum + prob * index, 0);
};

// 1. Construct Baseline Matrix (High Entropy / Sticky Bottom)
export const createBaselineMatrix = (): Matrix => {
  let matrix = [
    [0.90, 0.09, 0.01, 0.00, 0.00],
    [0.15, 0.70, 0.14, 0.01, 0.00],
    [0.01, 0.20, 0.60, 0.18, 0.01],
    [0.00, 0.05, 0.20, 0.60, 0.15],
    [0.00, 0.00, 0.10, 0.40, 0.50],
  ];
  return matrix.map(normalizeRow);
};

export const updateMatrixProbability = (matrix: Matrix, rowIdx: number, colIdx: number, newValue: number): Matrix => {
  const newMatrix = cloneMatrix(matrix);
  const row = newMatrix[rowIdx];
  const oldValue = row[colIdx];
  newValue = Math.max(0, Math.min(1, newValue));
  if (oldValue === newValue) return newMatrix;
  row[colIdx] = newValue;
  const diff = newValue - oldValue;
  const currentRestSum = 1 - oldValue;
  
  if (currentRestSum > 0.0001) {
    const scaleFactor = (1 - newValue) / currentRestSum;
    for (let j = 0; j < row.length; j++) {
      if (j !== colIdx) {
        row[j] = row[j] * scaleFactor;
      }
    }
  } else {
    const remainder = 1 - newValue;
    const targets = row.length - 1;
    if (targets > 0) {
      for (let j = 0; j < row.length; j++) {
        if (j !== colIdx) {
          row[j] = remainder / targets;
        }
      }
    }
  }
  newMatrix[rowIdx] = normalizeRow(row);
  return newMatrix;
};

const applyMicroHabit = (baseMatrix: Matrix, impactFactor: number): Matrix => {
  const matrix = cloneMatrix(baseMatrix);
  for (let i = 0; i < STATES_COUNT; i++) {
    if (i < STATES_COUNT - 1) matrix[i][i + 1] += impactFactor;
    if (i === STATES_COUNT - 1) matrix[i][i] += impactFactor;
    if (i > 0) matrix[i][i - 1] = Math.max(0, matrix[i][i - 1] - impactFactor); 
    else matrix[i][i] = Math.max(0, matrix[i][i] - impactFactor);
  }
  return matrix.map(normalizeRow);
};

const calculateMixingTime = (matrix: Matrix): number => {
  let dist = [1, 0, 0, 0, 0];
  let prevDist = [...dist];
  const threshold = 0.00001;
  const maxSteps = 5000;
  for (let t = 1; t < maxSteps; t++) {
    dist = multiplyVectorMatrix(dist, matrix);
    let change = 0;
    for(let i=0; i<STATES_COUNT; i++) change += Math.abs(dist[i] - prevDist[i]);
    if (change < threshold) return t;
    prevDist = [...dist];
  }
  return maxSteps;
};

const estimateSpectralGap = (mixingTime: number): number => {
    if (mixingTime === 0) return 0;
    return 1 / mixingTime;
};

export const runSimulation = (config: SimulationConfig, customMatrix?: Matrix): SimulationResult => {
  const { years, impactFactor, initialState } = config;
  const days = years * 365;

  const P_baseline = createBaselineMatrix();
  const P_habit = customMatrix ? cloneMatrix(customMatrix) : applyMicroHabit(P_baseline, impactFactor);

  const startVector = new Array(STATES_COUNT).fill(0);
  startVector[initialState] = 1.0;

  let v_base = [...startVector];
  let v_habit = [...startVector];
  
  const timeline: SimulationStep[] = [];
  const sampleRate = days > 7000 ? 60 : days > 2000 ? 30 : 7; 

  for (let t = 0; t <= days; t++) {
    if (t % sampleRate === 0 || t === days) {
      timeline.push({
        day: t,
        baselineExpectedValue: calculateExpectedValue(v_base),
        habitExpectedValue: calculateExpectedValue(v_habit),
        baselineDist: [...v_base],
        habitDist: [...v_habit],
      });
    }
    if (t < days) {
      v_base = multiplyVectorMatrix(v_base, P_baseline);
      v_habit = multiplyVectorMatrix(v_habit, P_habit);
    }
  }

  const mixingTime = calculateMixingTime(P_habit);
  const spectralGap = estimateSpectralGap(mixingTime);
  const steadyState = calculateSteadyState(P_habit);
  const probImprovement = ((v_habit[4] - v_base[4]) / (Math.max(v_base[4], 0.0001))) * 100;

  return {
    timeline,
    baselineFinalDist: v_base,
    habitFinalDist: v_habit,
    baselineMatrix: P_baseline,
    habitMatrix: P_habit,
    mixingTime,
    spectralGap,
    probabilityImprovement: probImprovement,
    steadyState
  };
};

// --- Module 4 Logic: Mobility & Spectral Gap ---

export const runConvergenceSimulation = (mobilityFactor: number): ConvergenceResult => {
  const N = 5;
  // Construct Parametric Matrix: P = (1-m)I + m(J/N)
  // J/N is a matrix with all entries = 1/N
  // This interpolates between Identity (m=0) and Uniform Random (m=1)
  const matrix: Matrix = [];
  for(let i=0; i<N; i++){
      const row = [];
      for(let j=0; j<N; j++){
          const uniform = 1/N;
          const identity = (i === j) ? 1 : 0;
          const val = (1 - mobilityFactor) * identity + mobilityFactor * uniform;
          row.push(val);
      }
      matrix.push(row);
  }

  // Analytical Eigenvalues for this specific matrix structure:
  // lambda_1 = 1
  // lambda_2...N = 1 - mobilityFactor
  const lambda2 = 1 - mobilityFactor;
  const spectralGap = mobilityFactor; // gap = 1 - lambda2 = 1 - (1-m) = m
  
  // Eigenvalues for visualization
  const eigenvalues = [1, lambda2, lambda2, lambda2, lambda2];

  // Run Simulation to calculate TVD
  const steadyState = Array(N).fill(1/N); // For uniform mobility matrix, steady state is uniform
  let dist = [1, 0, 0, 0, 0]; // Start at state 0
  
  const tvdData: ConvergenceDataPoint[] = [];
  const steps = 50;

  for(let t=0; t<=steps; t++) {
      // Calculate Total Variation Distance: 0.5 * sum|mu_i - pi_i|
      let tvd = 0;
      for(let i=0; i<N; i++) {
          tvd += 0.5 * Math.abs(dist[i] - steadyState[i]);
      }
      
      // Theoretical Bound approx: C * |lambda2|^t
      // We scale C to match start point approximately
      const theoretical = 0.8 * Math.pow(Math.abs(lambda2), t);

      tvdData.push({
          step: t,
          tvd,
          theoreticalBound: theoretical
      });

      // Evolve
      dist = multiplyVectorMatrix(dist, matrix);
  }

  return {
      mobilityFactor,
      eigenvalues,
      spectralGap,
      lambda2,
      tvdData
  };
};

// --- Module 7: Path Dependence Logic ---

const generateParametricMatrix = (config: PathConfig): Matrix => {
  const { effort, risk, isAbsorbing } = config;
  const base = createBaselineMatrix();
  const matrix: Matrix = [];

  for (let i = 0; i < STATES_COUNT; i++) {
    // If Absorbing and we are at the top, lock it
    if (isAbsorbing && i === STATES_COUNT - 1) {
      matrix.push([0, 0, 0, 0, 1]);
      continue;
    }

    let row = [...base[i]];
    
    // Effort: Moves probability from [i] to [i+1]
    if (i < STATES_COUNT - 1) {
      // Scale effort by how much 'stay' probability we have available
      const shift = effort * row[i] * 0.8; // Max shift 80% of current stability
      row[i] -= shift;
      row[i+1] += shift;
    }

    // Risk: Moves probability from [i] and [i+1] to [i-1] (failure) and [i+2] (leap)
    // Risk implies variance.
    const riskFactor = risk * 0.3; // Tunable constant
    
    // Add leap (i+2)
    if (i < STATES_COUNT - 2) {
      row[i+2] += riskFactor;
      // Subtract from stable/safe growth
      row[i] = Math.max(0, row[i] - riskFactor / 2);
      row[i+1] = Math.max(0, row[i+1] - riskFactor / 2);
    }
    
    // Add failure (i-1) - downside of risk
    if (i > 0) {
      row[i-1] += riskFactor;
      row[i] = Math.max(0, row[i] - riskFactor);
    }

    matrix.push(normalizeRow(row));
  }
  return matrix;
};

// Calculate Expected Steps to Absorption using Fundamental Matrix
const calculateTimeToAbsorption = (matrix: Matrix): number | null => {
  // Assuming State 4 is absorbing.
  // Check if P_44 is close to 1
  if (matrix[4][4] < 0.99) return null; // Not strictly absorbing

  // Q is the substochastic matrix for transient states (0, 1, 2, 3)
  const transientCount = 4;
  const Q: Matrix = [];
  for (let i = 0; i < transientCount; i++) {
    Q.push(matrix[i].slice(0, transientCount));
  }

  // Calculate N = (I - Q)^-1
  // First, compute A = I - Q
  const A: Matrix = [];
  for (let i = 0; i < transientCount; i++) {
    const row = [];
    for (let j = 0; j < transientCount; j++) {
      const val = (i === j ? 1 : 0) - Q[i][j];
      row.push(val);
    }
    A.push(row);
  }

  // Solve Ax = 1 vector for each row index? 
  // N * 1_vec = Expected steps.
  // This is equivalent to solving A * t = 1_vec
  const ones = Array(transientCount).fill(1);
  const t = solveLinearSystem(A, ones);
  
  // Return expected steps from State 0 (Stuck) or average?
  // Let's return from State 0 (Bottom)
  return t[0];
};

export const runPathSimulation = (config: PathConfig): PathResult => {
  const matrix = generateParametricMatrix(config);
  
  // 1. Calculate Time to Absorption (if absorbing)
  const expectedSteps = calculateTimeToAbsorption(matrix);

  // 2. Calculate Final Distribution (Steady State or Absorption Probabilities)
  let finalDist: Vector;
  if (config.isAbsorbing) {
     // If absorbing, eventually everyone ends up in absorbing states. 
     // For this simple model with only top being absorbing, it's trivial: [0,0,0,0,1]
     // UNLESS there are other bottom absorbing states (traps).
     // Our param generator doesn't create bottom traps usually.
     // So we just iterate large N to be safe/visual.
     let v = [1, 0, 0, 0, 0]; // Start bottom
     for(let i=0; i<500; i++) v = multiplyVectorMatrix(v, matrix);
     finalDist = v;
  } else {
     finalDist = calculateSteadyState(matrix);
  }

  return {
    matrix,
    finalDist,
    expectedStepsToAbsorb: expectedSteps,
    absorptionProbabilities: null
  };
};