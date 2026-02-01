import { WealthConfig, Equilibrium, PhaseDiagramDataPoint, WealthSimulationResult, WealthTrajectoryPoint } from '../types';

/**
 * Capital Accumulation Equation:
 * k_{t+1} = (1 - delta) * k_t + s * A * (k_t^gamma / (H^gamma + k_t^gamma))
 */
const nextK = (k: number, config: WealthConfig, withNoise: boolean = false): number => {
  const { A, s, H, gamma, delta, sigma } = config;
  
  // Production term with S-shape (Sigmoid-like production function)
  const production = s * A * (Math.pow(k, gamma) / (Math.pow(H, gamma) + Math.pow(k, gamma)));
  
  // Depreciation term
  const depreciation = delta * k;
  
  // Deterministic next step
  let k_next = k - depreciation + production;
  
  // Add noise if requested
  if (withNoise) {
    // Box-Muller transform for simple Gaussian noise
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    k_next += z * sigma;
  }

  // Boundary condition: Capital cannot be negative
  return Math.max(0, k_next);
};

/**
 * Find Equilibria (Fixed Points where k_{t+1} = k_t)
 * This is equivalent to finding roots of: s * A * f(k) - delta * k = 0
 */
const findEquilibria = (config: WealthConfig): Equilibrium[] => {
  const equilibria: Equilibrium[] = [];
  const maxSearchK = 50; // Maximum capital to search
  const step = 0.1;
  
  // Helper to calculate net growth: Production - Depreciation
  // We want points where Net Growth = 0 (or NextK = K)
  const netGrowth = (k: number) => {
    // k_{t+1} - k_t = -delta*k + production
    const prod = config.s * config.A * (Math.pow(k, config.gamma) / (Math.pow(config.H, config.gamma) + Math.pow(k, config.gamma)));
    return prod - config.delta * k;
  };

  // 1. Zero is always an equilibrium in this model structure if f(0)=0
  equilibria.push({ k: 0, type: 'Stable' }); // Usually unstable if marginal product is infinite, but here f'(0)=0 for gamma > 1, so it's a poverty trap base.

  // 2. Scan for other roots
  let prevSign = Math.sign(netGrowth(0.01));
  
  for (let k = 0.1; k <= maxSearchK; k += step) {
    const currentVal = netGrowth(k);
    const currentSign = Math.sign(currentVal);
    
    if (currentSign !== prevSign) {
      // Root found between k-step and k. Use Bisection for precision.
      let low = k - step;
      let high = k;
      for (let iter = 0; iter < 20; iter++) {
        const mid = (low + high) / 2;
        if (netGrowth(mid) * netGrowth(low) < 0) {
          high = mid;
        } else {
          low = mid;
        }
      }
      const rootK = (low + high) / 2;
      
      // Determine stability: derivative of transition function
      // If slope of phase diagram < 1 (or slope of net growth < 0), it's stable.
      // Net Growth slope < 0 means curve crosses from above to below axis.
      const isStable = netGrowth(rootK - 0.01) > 0 && netGrowth(rootK + 0.01) < 0;
      
      equilibria.push({ 
        k: rootK, 
        type: isStable ? 'Stable' : 'Unstable' 
      });
      
      prevSign = currentSign;
    }
  }

  return equilibria;
};

/**
 * Generate Phase Diagram Data
 */
const generatePhaseData = (config: WealthConfig): PhaseDiagramDataPoint[] => {
  const data: PhaseDiagramDataPoint[] = [];
  for (let k = 0; k <= 30; k += 0.5) {
    data.push({
      k,
      nextK: nextK(k, config, false),
      depreciation: k, // The 45 degree line (y = x)
    });
  }
  return data;
};

/**
 * Generate Cobweb Path (Example iteration)
 */
const generateCobweb = (config: WealthConfig, steps: number = 10): {k: number, nextK: number}[] => {
  const path: {k: number, nextK: number}[] = [];
  let k = config.initialK; // Start cobweb from initial K setting
  
  for (let i = 0; i < steps; i++) {
    const nk = nextK(k, config, false);
    // Vertical move: (k, k) -> (k, nk)
    path.push({ k: k, nextK: k }); 
    path.push({ k: k, nextK: nk });
    // Horizontal move: (k, nk) -> (nk, nk)
    path.push({ k: nk, nextK: nk });
    k = nk;
  }
  return path;
};

/**
 * Run Monte Carlo Simulation (Module 6)
 */
export const runWealthSimulation = (config: WealthConfig): WealthSimulationResult => {
  const t_steps = 50;
  const n_samples = 15; // Number of trajectories
  
  // 1. Solve Equilibria
  const equilibria = findEquilibria(config);
  
  // 2. Phase Data
  const phaseData = generatePhaseData(config);
  
  // 3. Cobweb
  const cobwebPath = generateCobweb(config);

  // 4. Time Series Simulation
  const trajectories: WealthTrajectoryPoint[] = [];
  
  // Initialize paths
  let currentKs = Array(n_samples).fill(0).map(() => {
    // Initial distribution around initialK
    return Math.max(0, config.initialK + (Math.random() - 0.5) * 4);
  });

  for (let t = 0; t <= t_steps; t++) {
    const point: WealthTrajectoryPoint = { step: t };
    
    // Apply "Big Push" Policy Shock
    if (t === config.pushTime && config.pushMagnitude > 0) {
      currentKs = currentKs.map(k => k + config.pushMagnitude);
    }

    currentKs.forEach((k, idx) => {
      point[`path${idx}`] = k;
    });
    trajectories.push(point);

    // Evolve
    currentKs = currentKs.map(k => nextK(k, config, true));
  }

  return {
    equilibria,
    phaseData,
    trajectories,
    cobwebPath
  };
};