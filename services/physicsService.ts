import { PhysicsConfig, PhysicsState, PhysicsSystemType } from '../types';

/**
 * Service to handle mathematical models for Dissipative Structures.
 * Using Float32Array for performance on grid operations.
 */

// --- BZ REACTION (Gray-Scott Model) ---
// Chemicals A and B. A is "food", B is "predator" (or autocatalyst).
// A + 2B -> 3B (reproduction)
// B -> P (death/dissipation)
const calcBZReaction = (current: Float32Array, next: Float32Array, w: number, h: number, config: PhysicsConfig) => {
    // Map generic config to specific model parameters
    // Feed rate (f): Controls input of A. Lower = starving, Higher = rich.
    // Kill rate (k): Controls death of B.
    const f = 0.01 + config.inputEnergy * 0.08; // Range 0.01 to 0.09
    const k = 0.045 + config.dissipation * 0.025; // Range 0.045 to 0.070
    
    const dA = 1.0; // Diffusion rate A
    const dB = 0.5; // Diffusion rate B
    
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const i = (y * w + x) * 2; // Stored as [A, B, A, B...]
            
            const a = current[i];
            const b = current[i + 1];
            
            // Laplacian (Diffusion)
            // Center weight -1, Neighbors 0.2, Diagonals 0.05 (Simple convolution)
            const i_u = ((y - 1) * w + x) * 2;
            const i_d = ((y + 1) * w + x) * 2;
            const i_l = (y * w + (x - 1)) * 2;
            const i_r = (y * w + (x + 1)) * 2;
            
            const lapA = (current[i_u] + current[i_d] + current[i_l] + current[i_r] - 4 * a);
            const lapB = (current[i_u+1] + current[i_d+1] + current[i_l+1] + current[i_r+1] - 4 * b);

            // Reaction-Diffusion Equation
            // A' = A + (Da * lapA - A*B*B + f*(1-A)) * dt
            // B' = B + (Db * lapB + A*B*B - (k+f)*B) * dt
            
            const abb = a * b * b;
            const nextA = a + (dA * lapA * 0.2 - abb + f * (1 - a)); 
            const nextB = b + (dB * lapB * 0.2 + abb - (k + f) * b);
            
            next[i] = Math.max(0, Math.min(1, nextA));
            next[i + 1] = Math.max(0, Math.min(1, nextB));
        }
    }
};

// --- BÉNARD CONVECTION (Simplified Fluid Grid) ---
// Simulating Heat (T) and Velocity (V).
// Hot cells try to move up, Cold cells try to move down.
const calcConvection = (current: Float32Array, next: Float32Array, w: number, h: number, config: PhysicsConfig) => {
    // grid structure: [Temp, Vy, Vx, unused] per cell
    const heatInput = config.inputEnergy * 0.2; 
    const viscosity = 0.9 - config.dissipation * 0.2; // Damping
    const buoyancy = 0.1;
    
    // Random noise
    const noise = config.randomness * 0.1;

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            let t = current[idx];
            let vy = current[idx + 1];
            let vx = current[idx + 2];

            // 1. Heat Source (Bottom) & Sink (Top)
            if (y > h - 4) t += heatInput; // Heat from bottom
            if (y < 4) t -= 0.1; // Cool at top

            // 2. Buoyancy (Heat rises)
            // If T is higher than average, force is Up (negative Vy)
            vy -= (t - 0.5) * buoyancy;

            // 3. Diffusion (Heat spreads)
            const idx_u = ((y - 1) * w + x) * 4;
            const idx_d = ((y + 1) * w + x) * 4;
            const idx_l = (y * w + (x - 1)) * 4;
            const idx_r = (y * w + (x + 1)) * 4;

            const lapT = (current[idx_u] + current[idx_d] + current[idx_l] + current[idx_r]) * 0.25 - t;
            t += lapT * 0.1;

            // 4. Advection (Simplified) - Velocity moves temperature
            // Very hacky approximation for visual effect:
            // If moving up, take temp from bottom neighbor
            if (vy < 0) t = t * 0.9 + current[idx_d] * 0.1;
            if (vy > 0) t = t * 0.9 + current[idx_u] * 0.1;

            // 5. Viscosity / Dissipation
            vy *= viscosity;
            vx *= viscosity;

            // 6. Interaction (Incompressible-ish)
            // If moving up into a wall or slow block, divert sideways
            // Divergence check is complex, we use simple deflection
            if (y < 5 && vy < 0) { vy *= -0.5; vx += (Math.random()-0.5); } // Hit top
            if (y > h - 5 && vy > 0) { vy *= -0.5; vx += (Math.random()-0.5); } // Hit bottom

            // Add randomness
            t += (Math.random() - 0.5) * noise;

            next[idx] = Math.max(0, Math.min(1, t));
            next[idx + 1] = vy;
            next[idx + 2] = vx;
        }
    }
};

// --- HURRICANE (Particle System) ---
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    temp: number;
    life: number;
}

const initHurricaneParticles = (count: number, w: number, h: number): Particle[] => {
    return Array(count).fill(0).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0,
        vy: 0,
        temp: Math.random(),
        life: Math.random()
    }));
};

const calcHurricane = (particles: Particle[], w: number, h: number, config: PhysicsConfig) => {
    const cx = w / 2;
    const cy = h / 2;
    const energy = config.inputEnergy; // Strength of low pressure
    const friction = 1.0 - (config.dissipation * 0.1); // Air resistance
    
    particles.forEach(p => {
        // Distance to center
        const dx = cx - p.x;
        const dy = cy - p.y;
        const distSq = dx*dx + dy*dy;
        const dist = Math.sqrt(distSq);

        // 1. Pressure Gradient Force (Suck into center)
        // Stronger if energy is high
        const force = (energy * 500) / (distSq + 100); 
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;

        // 2. Coriolis Effect (Rotation)
        // Deflect velocity to the right (Northern Hemisphere)
        const coriolis = 0.05 + energy * 0.1;
        p.vx += -p.vy * coriolis;
        p.vy += p.vx * coriolis;

        // 3. Thermodynamics (Pick up heat from ocean)
        // Outer bands pick up energy
        if (dist > 50) p.temp += energy * 0.01;
        
        // 4. Dissipation
        p.vx *= friction;
        p.vy *= friction;
        p.temp *= 0.99; // Cooling

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Random turbulence
        p.x += (Math.random() - 0.5) * config.randomness;
        p.y += (Math.random() - 0.5) * config.randomness;

        // Reset if sucked into eye or out of bounds
        if (dist < 5 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
             // Respawn at edges
             const angle = Math.random() * Math.PI * 2;
             const r = Math.min(w, h) * 0.45;
             p.x = cx + Math.cos(angle) * r;
             p.y = cy + Math.sin(angle) * r;
             p.vx = 0;
             p.vy = 0;
             p.temp = 0.2;
        }
    });
};

// --- ENTROPY CALCULATION ---
// Calculate "Visual Entropy" based on variance/distribution of values.
// Low Entropy = Ordered Pattern. High Entropy = Random Noise or Uniform Sludge.
const calculateEntropy = (data: Float32Array | Particle[], type: PhysicsSystemType): number => {
    let sum = 0;
    let sumSq = 0;
    let count = 0;

    if (type === 'hurricane') {
        const parts = data as Particle[];
        // Entropy based on velocity organization.
        // If all rotating same way -> Low Entropy (Ordered).
        // If random motion -> High Entropy.
        // We look at variance of angular momentum maybe? 
        // Simplification: Standard Deviation of positions (Cluster = low entropy)
        // Let's use spatial clustering.
        return 0.5; // Placeholder, visual estimation is harder for particles in this simple loop
    } else {
        const grid = data as Float32Array;
        const stride = type === 'convection' ? 4 : 2; // T or B channel
        for(let i=0; i<grid.length; i+=stride) {
            const val = grid[i + (type === 'bz_reaction' ? 1 : 0)]; // Look at chemical B or Temp
            sum += val;
            sumSq += val * val;
            count++;
        }
        const mean = sum / count;
        const variance = (sumSq / count) - (mean * mean);
        
        // For pattern formation, we want "Structure".
        // Homogeneous (Variance = 0) is "Dead" (High thermodynamic entropy/Equilibrium).
        // Noise (High Variance but uncorrelated) is "Chaos".
        // Patterns usually have high variance (peaks and valleys).
        // We map "Variance" to a "Structure Index".
        // Note: In thermodynamics, S is maximized at equilibrium (homogeneous).
        // So Variance ~ (S_max - S).
        return Math.max(0, 1.0 - Math.sqrt(variance) * 2); // Roughly
    }
};

export const initPhysics = (width: number, height: number, type: PhysicsSystemType): PhysicsState => {
    let grid, particles;
    if (type === 'hurricane') {
        particles = initHurricaneParticles(500, width, height);
    } else {
        // Convection: 4 channels (T, Vy, Vx, Padding)
        // BZ: 2 channels (A, B)
        const channels = type === 'convection' ? 4 : 2;
        grid = new Float32Array(width * height * channels);
        
        // Init state
        if (type === 'bz_reaction') {
            for(let i=0; i<grid.length; i+=2) {
                grid[i] = 1; // A = 1
                grid[i+1] = 0; // B = 0
                // Seed some B
                if (Math.random() < 0.05) grid[i+1] = 1;
                // Add a square of B in middle to start
                const idx = i/2;
                const x = idx % width;
                const y = Math.floor(idx / width);
                if (x > width/2 - 10 && x < width/2 + 10 && y > height/2 - 10 && y < height/2 + 10) {
                     grid[i+1] = 1;
                }
            }
        }
    }
    
    return {
        grid,
        particles,
        width,
        height,
        entropy: 0,
        stepCount: 0
    };
};

export const stepPhysics = (state: PhysicsState, config: PhysicsConfig, type: PhysicsSystemType): PhysicsState => {
    let nextGrid;
    
    if (type === 'convection') {
        nextGrid = new Float32Array(state.grid!.length);
        calcConvection(state.grid!, nextGrid, state.width, state.height, config);
    } else if (type === 'bz_reaction') {
        nextGrid = new Float32Array(state.grid!.length);
        calcBZReaction(state.grid!, nextGrid, state.width, state.height, config);
    } else {
        calcHurricane(state.particles!, state.width, state.height, config);
    }

    const entropy = calculateEntropy(state.grid || state.particles!, type);

    return {
        ...state,
        grid: nextGrid || state.grid,
        entropy,
        stepCount: state.stepCount + 1
    };
};